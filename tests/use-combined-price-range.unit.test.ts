import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  COMBINED_PRICE_CACHE_TTL_MS,
  clearCombinedPriceRangeCache,
  loadCombinedPriceRange,
} from "~/components/product/use-combined-price-range";

const originalFetch = globalThis.fetch;
const originalDateNow = Date.now;

afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
  clearCombinedPriceRangeCache();
});

test("combined price cache is reused within five minutes and refreshed after expiry", async () => {
  let now = 1_000;
  let fetchCount = 0;
  Date.now = () => now;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return Response.json({
      ranges: {
        "gid://shopify/Product/1": {
          minVariantPrice: { amount: String(fetchCount), currencyCode: "USD" },
          maxVariantPrice: { amount: "999", currencyCode: "USD" },
        },
      },
    });
  };

  const path = "/api/combined-prices";
  const id = "gid://shopify/Product/1";
  const first = await loadCombinedPriceRange(path, id);
  now += COMBINED_PRICE_CACHE_TTL_MS - 1;
  const cached = await loadCombinedPriceRange(path, id);
  now += 2;
  const refreshed = await loadCombinedPriceRange(path, id);

  assert.equal(fetchCount, 2);
  assert.equal(first?.minVariantPrice.amount, "1");
  assert.equal(cached?.minVariantPrice.amount, "1");
  assert.equal(refreshed?.minVariantPrice.amount, "2");
});
