import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnTo } from "../app/utils/return-to.ts";
import {
  parseWishlist,
  updateWishlistProductIds,
} from "../app/utils/wishlist.server.ts";

test("parseWishlist keeps unique Shopify product GIDs", () => {
  assert.deepEqual(
    parseWishlist(
      JSON.stringify([
        "gid://shopify/Product/1",
        "gid://shopify/Product/1",
        "not-a-gid",
        "gid://shopify/ProductVariant/2",
      ]),
    ),
    ["gid://shopify/Product/1"],
  );
  assert.deepEqual(parseWishlist("not-json"), []);
  assert.deepEqual(parseWishlist(null), []);
});

test("updateWishlistProductIds adds and removes a product", () => {
  assert.deepEqual(
    updateWishlistProductIds([], "gid://shopify/Product/1", "add"),
    ["gid://shopify/Product/1"],
  );
  assert.deepEqual(
    updateWishlistProductIds(
      ["gid://shopify/Product/1"],
      "gid://shopify/Product/1",
      "remove",
    ),
    [],
  );
});

test("safeReturnTo only accepts in-app relative paths", () => {
  assert.equal(
    safeReturnTo(
      new Request(
        "https://example.com/account/login?return_to=%2Fproducts%2Fchair",
      ),
    ),
    "/products/chair",
  );
  assert.equal(
    safeReturnTo(
      new Request(
        "https://example.com/account/login?return_to=https://evil.test",
      ),
      "/account",
    ),
    "/account",
  );
  assert.equal(
    safeReturnTo(
      new Request("https://example.com/account/login?return_to=//evil.test"),
      "/account",
    ),
    "/account",
  );
});
