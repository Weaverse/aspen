import assert from "node:assert/strict";
import test from "node:test";
import { CacheShort } from "../app/utils/cache";
import type { AppLoadContext } from "react-router";
import type { ThemivoItem } from "../app/types/wishlist.ts";
import { parse } from "graphql";
import { createRequestStorefront } from "../app/.server/storefront";
import { InMemoryCache } from "./helpers/cache";
import {
  hydrateThemivoItems,
  readThemivoSuggestions,
  WISHLIST_PRODUCTS,
} from "../app/utils/themivo-products.server.ts";

function fixture(count: number) {
  const items = Array.from({ length: count }, (_, index) => ({
    productId: String(index + 1),
    variantId: String(index + 1001),
    quantity: 2,
  })) as ThemivoItem[];
  const calls: string[][] = [];
  const products = new Map(
    items.flatMap((item) => {
      const productId = `gid://shopify/Product/${item.productId}`;
      const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
      return [
        [
          productId,
          {
            id: productId,
            title: `Item ${item.productId}`,
            handle: `item-${item.productId}`,
            requiresSellingPlan: false,
          },
        ],
        [
          variantId,
          {
            id: variantId,
            product: { id: productId },
            availableForSale: true,
            price: { amount: "10", currencyCode: "EUR" },
            compareAtPrice: { amount: "20", currencyCode: "EUR" },
            selectedOptions: [{ name: "Color", value: "Blue" }],
          },
        ],
      ] as [string, object][];
    }),
  );
  const storefront = {
    i18n: { country: "FR", language: "FR" },
    CacheShort: () => ({ maxAge: 1 }),
    graphql: async (
      _query: string,
      {
        variables,
        cache,
      }: {
        variables: { ids: string[] };
        cache: object;
      },
    ) => {
      assert.ok(variables.ids.length <= 250);
      assert.deepEqual(cache, CacheShort());
      calls.push(variables.ids);
      // Shopify can return null nodes or nodes out of item order.
      return {
        data: {
          nodes: [...variables.ids]
            .reverse()
            .map((id) => products.get(id) ?? null),
        },
      };
    },
  } as unknown as AppLoadContext["storefront"];
  return { items, calls, storefront, products };
}

for (const count of [125, 126, 500]) {
  test(`hydrates ${count} variant items within the 250-ID limit`, async () => {
    const { items, calls, storefront } = fixture(count);
    const result = await hydrateThemivoItems(storefront, items, [
      items[0].productId,
    ]);
    assert.deepEqual(
      calls.map((batch) => batch.length),
      count === 125 ? [250] : count === 126 ? [250, 2] : [250, 250, 250, 250],
    );
    assert.equal(result.length, count);
    assert.deepEqual(
      result.map((item) => item.productId),
      items.map((item) => `gid://shopify/Product/${item.productId}`),
    );
    assert.equal(result[0].price, null);
    assert.equal(result[0].compareAtPrice, null);
    assert.equal(result.at(-1)?.quantity, 2);
    assert.equal(
      result.at(-1)?.merchandiseId,
      `gid://shopify/ProductVariant/${items.at(-1)?.variantId}`,
    );
    assert.deepEqual(result.at(-1)?.price, {
      amount: "10",
      currencyCode: "EUR",
    });
  });
}

test("deduplicates IDs and keeps missing variants unavailable across batches", async () => {
  const { items, calls, storefront, products } = fixture(126);
  products.delete("gid://shopify/ProductVariant/1126");
  const result = await hydrateThemivoItems(
    storefront,
    [...items, items[0]],
    [],
  );
  assert.deepEqual(
    calls.map((batch) => batch.length),
    [250, 2],
  );
  assert.equal(result.length, 127);
  assert.equal(result[125].merchandiseId, null);
  assert.equal(result[125].price, null);
  assert.equal(result[126].productId, result[0].productId);
});

test("empty lists do not query Shopify", async () => {
  const { storefront, calls } = fixture(0);
  assert.deepEqual(await hydrateThemivoItems(storefront, [], []), []);
  assert.deepEqual(calls, []);
});

test("a failed later batch does not return a misleading partial saved list", async () => {
  const { storefront, items } = fixture(126);
  const originalQuery = storefront.graphql;
  let requests = 0;
  storefront.graphql = (async (...args: Parameters<typeof originalQuery>) => {
    requests += 1;
    if (requests === 2) {
      throw new Error("Shopify unavailable");
    }
    return originalQuery(...args);
  }) as typeof originalQuery;
  await assert.rejects(
    () => hydrateThemivoItems(storefront, items, []),
    /Shopify unavailable/,
  );
  assert.equal(requests, 2);
});

function assertMarketContext(source: string) {
  const operation = parse(source).definitions.find(
    (node) => node.kind === "OperationDefinition",
  );
  assert.ok(operation?.kind === "OperationDefinition");
  for (const [name, type] of [
    ["country", "CountryCode"],
    ["language", "LanguageCode"],
  ]) {
    const variable = operation.variableDefinitions?.find(
      (node) => node.variable.name.value === name,
    );
    assert.equal(variable?.type.kind, "NamedType");
    assert.ok(variable?.type.kind === "NamedType");
    assert.equal(variable.type.name.value, type);
  }
  const context = operation.directives?.find(
    (node) => node.name.value === "inContext",
  );
  assert.ok(
    context,
    "Shopify requires @inContext to apply the shopper's market",
  );
  for (const name of ["country", "language"]) {
    const argument = context.arguments?.find(
      (node) => node.name.value === name,
    );
    assert.ok(argument?.value.kind === "Variable");
    assert.equal(argument.value.name.value, name);
  }
}

test("wishlist product document declares and applies market variables", () => {
  assertMarketContext(WISHLIST_PRODUCTS);
});

test("wishlist suggestion document declares and applies market variables", async () => {
  const storefront = {
    graphql: async (source: string) => {
      assertMarketContext(source);
      return { data: { collection: null } };
    },
  } as unknown as AppLoadContext["storefront"];
  assert.deepEqual(
    await readThemivoSuggestions(
      storefront,
      "gid://shopify/Collection/1",
      2,
      [],
    ),
    [],
  );
});

for (const [path, country, language] of [
  ["/fr-fr/wishlist", "FR", "FR"],
  ["/es-es/wishlist", "ES", "ES"],
]) {
  test(`SDK injects the request market into both Themivo queries on ${path}`, async () => {
    const originalFetch = globalThis.fetch;
    const requests: {
      query: string;
      variables: Record<string, unknown>;
    }[] = [];
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as (typeof requests)[number];
      requests.push(body);
      return Response.json({
        data: body.query.includes("ThemivoWishlistSuggestions")
          ? { collection: { products: { nodes: [] } } }
          : { nodes: [] },
      });
    };
    try {
      const storefront = createRequestStorefront({
        request: new Request(`https://store.example${path}`),
        env: {
          PUBLIC_STORE_DOMAIN: "store.example",
          PUBLIC_STOREFRONT_API_TOKEN: "test-public-token",
        } as Env,
        cache: new InMemoryCache(),
        waitUntil: () => undefined,
      });
      await hydrateThemivoItems(storefront, fixture(1).items, []);
      await readThemivoSuggestions(
        storefront,
        "gid://shopify/Collection/1",
        2,
        [],
      );
      assert.equal(requests.length, 2);
      for (const request of requests) {
        assertMarketContext(request.query);
        assert.equal(request.variables.country, country);
        assert.equal(request.variables.language, language);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
