import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { LoaderFunctionArgs } from "react-router";
import { loader } from "../app/routes/($locale).api.combined-prices";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const child = "gid://shopify/Product/1";
const sibling = "gid://shopify/Product/2";

function callLoader(ids: string[], key = "server-only-test-key") {
  const url = new URL("https://shop.example/api/combined-prices");
  for (const id of ids) {
    url.searchParams.append("id", id);
  }
  return loader({
    request: new Request(url),
    context: {
      env: { WEAVERSE_API_KEY: key },
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

test("combined child receives the full group range in storefront currency", async () => {
  globalThis.fetch = async (_url, init) => {
    assert.match(
      String(init?.headers && JSON.stringify(init.headers)),
      /Bearer/,
    );
    return Response.json({
      nodes: [
        {
          id: child,
          combinedListing: {
            combinedListingChildren: {
              nodes: [{ product: { id: child } }, { product: { id: sibling } }],
            },
          },
        },
      ],
    });
  };

  const result = await callLoader([child]);
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
