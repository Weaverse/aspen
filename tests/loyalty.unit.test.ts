import assert from "node:assert/strict";
import test from "node:test";
import { estimateLoyaltyPoints } from "../app/utils/loyalty.ts";
import { shopifyNumericId } from "../app/utils/shopify-id.ts";

test("shopifyNumericId extracts the trailing numeric id from a GID", () => {
  assert.equal(
    shopifyNumericId("gid://shopify/ProductVariant/14870143009136"),
    "14870143009136",
  );
  assert.equal(shopifyNumericId("14870143009136"), "14870143009136");
  assert.equal(shopifyNumericId(""), "");
  assert.equal(shopifyNumericId(null), "");
});

test("estimateLoyaltyPoints floors price times rate and hides invalid values", () => {
  assert.equal(estimateLoyaltyPoints("199.50", 1), 199);
  assert.equal(estimateLoyaltyPoints(50, 2), 100);
  assert.equal(estimateLoyaltyPoints(0, 1), 0);
  assert.equal(estimateLoyaltyPoints("abc", 1), 0);
  assert.equal(estimateLoyaltyPoints(20, 0), 0);
});
