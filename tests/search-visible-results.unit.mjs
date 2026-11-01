import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  entryPoints: [`${root}app/utils/search-results.server.ts`],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  alias: { "~": `${root}app` },
});
const { searchVisibleProducts, paginateSearch } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

function product(index, hidden = false) {
  return {
    id: `p${index}`,
    tags: hidden ? ["combined"] : [],
    priceRange: {
      minVariantPrice: { amount: `${index}`, currencyCode: "USD" },
      maxVariantPrice: { amount: `${index}`, currencyCode: "USD" },
    },
  };
}

test("hidden matches are excluded before counting and slicing, with reversible cursors", async () => {
  const index = Array.from({ length: 20 }, (_, i) =>
    product(i, i === 0 || i === 8),
  );
  const calls = [];
  const storefront = {
    CacheShort: () => ({ maxAge: 1 }),
    async query(document, options) {
      calls.push(options);
      if (document.includes("SearchVisibleIndex")) {
        return {
          products: {
            nodes: index,
            filters: [],
            pageInfo: { hasNextPage: false },
          },
        };
      }
      // Node hydration need not preserve order; helper must preserve search order.
      return {
        nodes: options.variables.ids
          .map((id) => index.find((p) => p.id === id))
          .reverse(),
      };
    },
  };
  const variables = {
    searchTerm: "chair",
    filters: [],
    sortKey: "RELEVANCE",
    reverse: false,
  };
  const first = (
    await searchVisibleProducts(storefront, variables, { first: 8 })
  ).products;
  assert.equal(first.totalCount, 18);
  assert.equal(first.nodes.length, 8);
  assert.equal(first.nodes[0].id, "p1");
  const second = (
    await searchVisibleProducts(storefront, variables, {
      first: 8,
      endCursor: first.pageInfo.endCursor,
    })
  ).products;
  assert.equal(second.nodes.length, 8);
  assert.equal(
    new Set([...first.nodes, ...second.nodes].map((p) => p.id)).size,
    16,
  );
  const previous = (
    await searchVisibleProducts(storefront, variables, {
      last: 8,
      startCursor: second.pageInfo.startCursor,
    })
  ).products;
  assert.deepEqual(previous.nodes, first.nodes);
  assert.equal(previous.pageInfo.hasPreviousPage, false);
  assert.equal(calls[0].variables.searchTerm, "chair");
  assert.ok(calls.every((call) => call.cache.maxAge === 1));
  assert.equal(calls[1].variables.ids.length, 8);
});

test("all-hidden matches produce an empty state without loading cards", async () => {
  let calls = 0;
  const result = await searchVisibleProducts(
    {
      CacheShort: () => ({}),
      query: async () => {
        calls += 1;
        return {
          products: {
            nodes: [product(1, true)],
            filters: [],
            pageInfo: { hasNextPage: false },
          },
        };
      },
    },
    {
      searchTerm: "Desmond",
      filters: [],
      sortKey: "RELEVANCE",
      reverse: false,
    },
    { first: 8 },
  );
  assert.equal(result.products.totalCount, 0);
  assert.deepEqual(result.products.nodes, []);
  assert.equal(calls, 1);
});

test("metadata pagination is bounded by Shopify's 1000-result limit", async () => {
  let calls = 0;
  const result = await searchVisibleProducts(
    {
      CacheShort: () => ({}),
      query: async (document, { variables }) => {
        if (!document.includes("SearchVisibleIndex")) {
          return { nodes: variables.ids.map((id) => ({ ...product(1), id })) };
        }
        calls += 1;
        return {
          products: {
            nodes: Array.from({ length: 250 }, (_, i) =>
              product((calls - 1) * 250 + i),
            ),
            filters: [],
            pageInfo: { hasNextPage: true, endCursor: `${calls}` },
          },
        };
      },
    },
    { searchTerm: "chair", filters: [], sortKey: "PRICE", reverse: true },
    { first: 9 },
  );
  assert.equal(calls, 4);
  assert.equal(result.products.totalCount, 1000);
  assert.equal(result.products.nodes.length, 9);
});

test("last page exposes only remaining products and no extra Load more", () => {
  const page = paginateSearch(
    Array.from({ length: 24 }, (_, i) => i),
    { first: 8, endCursor: "visible:16" },
  );
  assert.equal(page.nodes.length, 8);
  assert.equal(page.pageInfo.hasNextPage, false);
  assert.equal(paginateSearch([], { first: 8 }).totalCount, 0);
  const stale = paginateSearch(
    Array.from({ length: 24 }, (_, i) => i),
    { first: 8, endCursor: "visible:24" },
  );
  assert.deepEqual(stale.nodes, page.nodes);
});

test("price bounds remain independent of filters and use maximum variant price", async () => {
  const low = product(10);
  const high = product(20);
  low.priceRange.maxVariantPrice.amount = "2000";
  const result = await searchVisibleProducts(
    {
      CacheShort: () => ({}),
      query: async (document, { variables }) => {
        if (!document.includes("SearchVisibleIndex")) {
          return { nodes: [high] };
        }
        return {
          products: {
            nodes: variables.filters.length ? [high] : [low, high],
            filters: [],
            pageInfo: { hasNextPage: false },
          },
        };
      },
    },
    {
      searchTerm: "chair",
      filters: [{ price: { max: 100 } }],
      sortKey: "PRICE",
      reverse: false,
    },
    { first: 8 },
  );
  assert.equal(result.products.totalCount, 1);
  assert.equal(
    result.highestPriceProduct.nodes[0].priceRange.maxVariantPrice.amount,
    "2000",
  );
  assert.equal(
    result.lowestPriceProduct.nodes[0].priceRange.minVariantPrice.amount,
    "10",
  );
});
