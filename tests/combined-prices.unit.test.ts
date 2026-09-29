import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { InMemoryCache } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { loader } from "../app/routes/($locale).api.combined-prices";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const child = "gid://shopify/Product/1";
const sibling = "gid://shopify/Product/2";

function callLoader(
  ids: string[],
  key = "server-only-test-key",
  {
    cache = new InMemoryCache(),
    waitUntil = () => undefined,
  }: {
    cache?: Cache;
    waitUntil?: (promise: Promise<unknown>) => void;
  } = {},
) {
  const url = new URL("https://shop.example/api/combined-prices");
  for (const id of ids) {
    url.searchParams.append("id", id);
  }
  return loader({
    request: new Request(url),
    context: {
      env: { WEAVERSE_API_KEY: key },
      cache,
      waitUntil,
      storefront: {
        i18n: { country: "FR", language: "FR" },
        async query(_query: string, options: { variables: { ids: string[] } }) {
          assert.deepEqual(options.variables.ids, [child, sibling]);
          return {
            nodes: [
              {
                id: child,
                priceRange: {
                  minVariantPrice: { amount: "469.0", currencyCode: "EUR" },
                  maxVariantPrice: { amount: "469.0", currencyCode: "EUR" },
                },
              },
              {
                id: sibling,
                priceRange: {
                  minVariantPrice: { amount: "999.0", currencyCode: "EUR" },
                  maxVariantPrice: { amount: "999.0", currencyCode: "EUR" },
                },
              },
            ],
          };
        },
      },
    },
    params: {},
  } as unknown as LoaderFunctionArgs);
}

test("Hydrogen caches products without combined children", async () => {
  const productId = "gid://shopify/Product/404";
  const cache = new InMemoryCache();
  let cacheReads = 0;
  let cacheWrites = 0;
  let adminRequests = 0;
  const originalMatch = cache.match.bind(cache);
  const originalPut = cache.put.bind(cache);
  cache.match = (...args) => {
    cacheReads += 1;
    return originalMatch(...args);
  };
  cache.put = (...args) => {
    cacheWrites += 1;
    return originalPut(...args);
  };
  const pending: Promise<unknown>[] = [];

  globalThis.fetch = async () => {
    adminRequests += 1;
    return Response.json({
      node: { id: productId, combinedListing: null },
    });
  };

  const request = () =>
    loader({
      request: new Request(
        `https://shop.example/api/combined-prices?id=${encodeURIComponent(productId)}`,
      ),
      context: {
        env: { WEAVERSE_API_KEY: "server-only-test-key" },
        cache,
        waitUntil: (promise: Promise<unknown>) => pending.push(promise),
        storefront: {
          i18n: { country: "US", language: "EN" },
          async query() {
            throw new Error("Storefront query should not run");
          },
        },
      },
      params: {},
    } as unknown as LoaderFunctionArgs);

  await request();
  await Promise.all(pending.splice(0));
  await request();

  assert.ok(cacheReads > 0);
  assert.ok(cacheWrites > 0);
  assert.equal(adminRequests, 1);
});

test("combined child receives the full group range in storefront currency", async () => {
  const cache = new InMemoryCache();
  const pending: Promise<unknown>[] = [];
  let adminRequests = 0;
  globalThis.fetch = async (_url, init) => {
    adminRequests += 1;
    assert.match(
      String(init?.headers && JSON.stringify(init.headers)),
      /Bearer/,
    );
    return Response.json({
      node: {
        id: child,
        combinedListing: {
          combinedListingChildren: {
            nodes: [{ product: { id: child } }, { product: { id: sibling } }],
          },
        },
      },
    });
  };

  const cacheOptions = {
    cache,
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  };
  const result = await callLoader(
    [child],
    "server-only-test-key",
    cacheOptions,
  );
  await Promise.all(pending.splice(0));
  await callLoader([child], "server-only-test-key", cacheOptions);
  const ranges = result.data as {
    ranges: Record<
      string,
      { minVariantPrice: unknown; maxVariantPrice: unknown }
    >;
  };
  assert.deepEqual(ranges.ranges[child], {
    minVariantPrice: { amount: "469.0", currencyCode: "EUR" },
    maxVariantPrice: { amount: "999.0", currencyCode: "EUR" },
  });
  assert.equal(adminRequests, 1);
});

test("invalid IDs are rejected before calling the privileged proxy", async () => {
  globalThis.fetch = async () => {
    throw new Error("Unexpected proxy call");
  };
  const result = await callLoader(["not-a-product-id"]);
  assert.equal(result.init?.status, 400);
});

test("missing server key returns a safe fallback", async () => {
  const result = await callLoader([child], "");
  assert.equal(result.init?.status, 503);
});
