import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export * from "./app/utils/search-results.server";
      export { COMBINED_LISTINGS_CONFIGS } from "./app/utils/combined-listings";`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  alias: { "~": `${root}app` },
});
const { searchVisibleProducts, paginateSearch, COMBINED_LISTINGS_CONFIGS } =
  await import(
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
  assert.equal(calls[0].variables.searchTerm, '(chair) AND NOT tag:"combined"');
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

// Model Shopify's facet computation at the query boundary, before local slicing.
// Blue exists only on the hidden listing; Green remains a valid alternative to Red.
function facetStorefront() {
  const catalog = [
    { ...product(1), color: "Red" },
    { ...product(2, true), color: "Blue" },
    { ...product(3), color: "Green" },
  ];
  const calls = [];
  return {
    calls,
    CacheShort: () => ({}),
    async query(document, { variables }) {
      if (!document.includes("SearchVisibleIndex")) {
        return { nodes: catalog.filter((p) => variables.ids.includes(p.id)) };
      }
      calls.push(variables);
      const candidates = variables.searchTerm.endsWith('AND NOT tag:"combined"')
        ? catalog.filter((p) => !p.tags.includes("combined"))
        : catalog;
      const colors = variables.filters.flatMap((f) =>
        f.variantOption?.name === "Color" ? [f.variantOption.value] : [],
      );
      return {
        products: {
          nodes: candidates.filter(
            (p) => !colors.length || colors.includes(p.color),
          ),
          filters: [
            {
              id: "filter.v.option.color",
              label: "Color",
              type: "LIST",
              values: ["Red", "Blue", "Green"].map((color) => ({
                id: color,
                label: color,
                count: candidates.filter((p) => p.color === color).length,
                input: JSON.stringify({
                  variantOption: { name: "Color", value: color },
                }),
              })),
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      };
    },
  };
}

for (const selected of [[], ["Red"], ["Blue"], ["Red", "Green"]]) {
  test(`facets exclude hidden-only options and retain Shopify alternatives: ${selected.join(",") || "unfiltered"}`, async () => {
    const storefront = facetStorefront();
    const filters = selected.map((value) => ({
      variantOption: { name: "Color", value },
    }));
    const result = await searchVisibleProducts(
      storefront,
      {
        searchTerm: "sofa OR chair",
        filters,
        sortKey: "RELEVANCE",
        reverse: false,
      },
      { first: 1 },
    );
    assert.deepEqual(
      result.products.filters[0].values.map(({ label, count }) => [
        label,
        count,
      ]),
      [
        ["Red", 1],
        ["Blue", 0],
        ["Green", 1],
      ],
    );
    assert.equal(
      result.products.totalCount,
      selected.includes("Blue") ? 0 : selected.length || 2,
    );
    assert.deepEqual(storefront.calls[0].filters, filters);
    assert.ok(
      storefront.calls.every(
        (call) => call.searchTerm === '(sofa OR chair) AND NOT tag:"combined"',
      ),
    );
    assert.equal(storefront.calls.length, selected.length ? 2 : 1);
  });
}

test("turning off combined-listing hiding preserves the original query and facets", async () => {
  COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList = false;
  try {
    const storefront = facetStorefront();
    const result = await searchVisibleProducts(
      storefront,
      { searchTerm: "chair", filters: [], sortKey: "PRICE", reverse: true },
      { first: 8 },
    );
    assert.equal(result.products.totalCount, 3);
    assert.equal(
      result.products.filters[0].values.find((v) => v.label === "Blue").count,
      1,
    );
    assert.equal(storefront.calls[0].searchTerm, "chair");
  } finally {
    COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList = true;
  }
});
