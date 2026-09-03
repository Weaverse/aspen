import assert from "node:assert/strict";
import test from "node:test";
import type { CustomerAccount } from "@shopify/hydrogen";
import { safeReturnTo } from "../app/utils/return-to.ts";
import {
  parseWishlist,
  updateWishlistProductIds,
  writeWishlist,
} from "../app/utils/wishlist.server.ts";

const wishlist = {
  customerId: "gid://shopify/Customer/1",
  compareDigest: "digest",
  productIds: ["gid://shopify/Product/1"],
};

function customerAccountWithMutationResult(result: unknown) {
  return {
    mutate: async () => result,
  } as unknown as CustomerAccount;
}

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

test("writeWishlist does not report transient GraphQL failures as setup errors", async () => {
  const customerAccount = customerAccountWithMutationResult({
    data: null,
    errors: [
      {
        message: "The Customer Account API is temporarily unavailable.",
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      },
    ],
  });

  const result = await writeWishlist(
    customerAccount,
    wishlist,
    wishlist.productIds,
  );

  assert.equal(result.ok, false);
  assert.equal(result.setupRequired, false);
});

test("writeWishlist reports permission failures as setup errors", async () => {
  const customerAccount = customerAccountWithMutationResult({
    data: null,
    errors: [
      {
        message: "Access denied for customer metafields.",
        extensions: { code: "ACCESS_DENIED" },
      },
    ],
  });

  const result = await writeWishlist(
    customerAccount,
    wishlist,
    wishlist.productIds,
  );

  assert.equal(result.ok, false);
  assert.equal(result.setupRequired, true);
});

test("writeWishlist treats missing mutation payloads as transient failures", async () => {
  const customerAccount = customerAccountWithMutationResult({
    data: { metafieldsSet: null },
    errors: [],
  });

  const result = await writeWishlist(
    customerAccount,
    wishlist,
    wishlist.productIds,
  );

  assert.equal(result.ok, false);
  assert.equal(result.setupRequired, false);
});

test("writeWishlist reports metafield permission user errors as setup errors", async () => {
  const customerAccount = customerAccountWithMutationResult({
    data: {
      metafieldsSet: {
        userErrors: [
          {
            code: "APP_NOT_AUTHORIZED",
            field: ["metafields", "0"],
            message: "The app cannot update this metafield.",
          },
        ],
      },
    },
    errors: [],
  });

  const result = await writeWishlist(
    customerAccount,
    wishlist,
    wishlist.productIds,
  );

  assert.equal(result.ok, false);
  assert.equal(result.setupRequired, true);
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
