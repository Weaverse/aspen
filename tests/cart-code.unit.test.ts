import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeDiscountCodes,
  uppercaseCartCode,
} from "../app/utils/cart-code.ts";

test("cart codes are uppercase without changing internal spaces", () => {
  assert.equal(uppercaseCartCode("test 2"), "TEST 2");
});

test("merges a new discount with existing cart codes", () => {
  assert.deepEqual(mergeDiscountCodes(["WELCOME"], "VIP"), ["WELCOME", "VIP"]);
});

test("does not duplicate an existing discount code", () => {
  assert.deepEqual(mergeDiscountCodes(["WELCOME"], "welcome"), ["WELCOME"]);
});
