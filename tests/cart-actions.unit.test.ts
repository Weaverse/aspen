import assert from "node:assert/strict";
import test from "node:test";
import {
  addGiftCardCodes,
  applyCartCode,
  updateDiscountCodes,
} from "../app/utils/cart-codes.server.ts";

test("Order Summary applies valid discounts even when the gift mutation silently ignores them", async () => {
  for (const code of ["test1", "test 2"]) {
    const cart = {
      async get() {
        return { discountCodes: [{ code: "WELCOME" }], appliedGiftCards: [] };
      },
      async addGiftCardCodes() {
        // Shopify can return an unchanged cart without userErrors for a
        // value that is not an applicable gift card.
        return {
          cart: { discountCodes: [], appliedGiftCards: [] },
          userErrors: [],
        };
      },
      async updateDiscountCodes(codes: string[]) {
        return {
          cart: {
            discountCodes: codes.map((value) => ({
              code: value,
              applicable: true,
            })),
            appliedGiftCards: [],
          },
          userErrors: [],
        };
      },
    };
    const result = await applyCartCode(cart, code, {
      allowDiscountCode: true,
      allowGiftCard: true,
    });
    assert.equal(result.codeType, "discount");
    assert.deepEqual(
      result.cart.discountCodes.map((discount) => discount.code),
      ["WELCOME", code.toUpperCase()],
    );
  }
});

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

test("unaccepted gift codes fall back to the drawer discount flow and preserve existing codes", async () => {
  const calls: unknown[] = [];
  const cart = {
    async get() {
      calls.push("get");
      return { discountCodes: [{ code: "WELCOME" }] };
    },
    async addGiftCardCodes(codes: string[]) {
      calls.push(codes);
      return {
        cart: { discountCodes: [] },
        userErrors: [{ message: "Invalid gift card" }],
      };
    },
    async updateDiscountCodes(codes: string[]) {
      calls.push(codes);
      return {
        cart: {
          discountCodes: codes.map((code) => ({ code, applicable: true })),
        },
        userErrors: [],
      };
    },
  };
  const result = await applyCartCode(cart, "VIP", {
    allowDiscountCode: true,
    allowGiftCard: true,
  });
  assert.equal(result.codeType, "discount");
  assert.equal(result.codeApplied, true);
  assert.deepEqual(calls, ["get", ["VIP"], "get", ["WELCOME", "VIP"]]);
});

test("combined field honors enabled types and does not mask API failures", async () => {
  const calls: unknown[] = [];
  const cart = {
    async get() {
      return null;
    },
    async addGiftCardCodes(codes: string[]) {
      calls.push(codes);
      return { errors: [{ message: "API failure" }], userErrors: [] };
    },
    async updateDiscountCodes(codes: string[]) {
      calls.push(codes);
      return { errors: [], userErrors: [] };
    },
  };
  assert.equal(
    (
      await applyCartCode(cart, " GIFT 2024 ", {
        allowDiscountCode: false,
        allowGiftCard: true,
      })
    ).codeType,
    "gift-card",
  );
  assert.deepEqual(calls, [["GIFT2024"]]);
  calls.length = 0;
  assert.equal(
    (
      await applyCartCode(cart, "VIP", {
        allowDiscountCode: true,
        allowGiftCard: false,
      })
    ).codeType,
    "discount",
  );
  assert.deepEqual(calls, [["VIP"]]);
});

test("gift-card acceptance compares IDs and never stores an accepted gift code as a discount", async () => {
  for (const applied of [false, true]) {
    const calls: unknown[] = [];
    const previousGiftCards = [{ id: "old-gift" }];
    const cart = {
      async get() {
        return {
          discountCodes: [{ code: "WELCOME" }],
          appliedGiftCards: previousGiftCards,
        };
      },
      async updateDiscountCodes(codes: string[]) {
        calls.push(codes);
        return {
          cart: {
            discountCodes: codes.map((value) => ({
              code: value,
              applicable: value === "WELCOME",
            })),
            appliedGiftCards: previousGiftCards,
          },
          userErrors: [],
        };
      },
      async addGiftCardCodes(codes: string[]) {
        calls.push(codes);
        return {
          cart: {
            discountCodes: [
              { code: "WELCOME", applicable: true },
              ...(calls.length > 1
                ? [{ code: "GIFT 2024", applicable: false }]
                : []),
            ],
            appliedGiftCards: applied
              ? [...previousGiftCards, { id: "new-gift" }]
              : previousGiftCards,
          },
          userErrors: [],
        };
      },
    };
    const result = await applyCartCode(cart, "GIFT 2024", {
      allowDiscountCode: true,
      allowGiftCard: true,
    });
    assert.equal(result.codeType, applied ? "gift-card" : "discount");
    assert.equal(result.codeApplied, applied);
    assert.deepEqual(result.cart?.discountCodes, [
      { code: "WELCOME", applicable: true },
    ]);
    assert.deepEqual(
      calls,
      applied
        ? [["GIFT2024"]]
        : [["GIFT2024"], ["WELCOME", "GIFT 2024"], ["WELCOME"]],
    );
  }
});

test("discount API failures remain visible after gift-card fallback", async () => {
  let giftCalls = 0;
  const cart = {
    async get() {
      return null;
    },
    async updateDiscountCodes() {
      return { errors: [{ message: "API failure" }], userErrors: [] };
    },
    async addGiftCardCodes() {
      giftCalls += 1;
      return { errors: [], userErrors: [] };
    },
  };
  const result = await applyCartCode(cart, "test1", {
    allowDiscountCode: true,
    allowGiftCard: true,
  });
  assert.equal(giftCalls, 1);
  assert.equal(result.codeApplied, false);
  assert.deepEqual(result.errors, [{ message: "API failure" }]);
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
