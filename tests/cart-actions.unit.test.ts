import assert from "node:assert/strict";
import test from "node:test";
import {
  addGiftCardCodes,
  updateDiscountCodes,
} from "../app/utils/cart-codes.server.ts";

test("discount update preserves existing codes and returns an inapplicable new code", async () => {
  const updates: string[][] = [];
  const mutationResult = {
    cart: {
      id: "gid://shopify/Cart/1",
      discountCodes: [
        { code: "WELCOME", applicable: true },
        { code: "EXPIRED", applicable: false },
      ],
    },
    errors: [],
    userErrors: [],
  };
  const cart = {
    async get() {
      return {
        id: "gid://shopify/Cart/1",
        discountCodes: [{ code: "WELCOME", applicable: true }],
      };
    },
    async updateDiscountCodes(codes: string[]) {
      updates.push(codes);
      return mutationResult;
    },
  };

  const result = await updateDiscountCodes(cart, "EXPIRED");

  assert.deepEqual(updates, [["WELCOME", "EXPIRED"]]);
  assert.equal(result, mutationResult);
  assert.deepEqual(result.cart.discountCodes, [
    { code: "WELCOME", applicable: true },
    { code: "EXPIRED", applicable: false },
  ]);
});

test("gift-card update uses only the dedicated gift-card mutation", async () => {
  const giftCardCalls: string[][] = [];
  const mutationResult = {
    cart: {
      id: "gid://shopify/Cart/1",
      appliedGiftCards: [
        { id: "gid://shopify/AppliedGiftCard/1", lastCharacters: "2024" },
      ],
    },
    errors: [],
    userErrors: [],
  };
  const cart = {
    async addGiftCardCodes(codes: string[]) {
      giftCardCalls.push(codes);
      return mutationResult;
    },
  };

  const result = await addGiftCardCodes(cart, [" GIFT 2024 "]);

  assert.deepEqual(giftCardCalls, [["GIFT2024"]]);
  assert.equal(result, mutationResult);
});
