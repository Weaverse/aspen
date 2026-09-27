import assert from "node:assert/strict";
import test from "node:test";
import { mergeDiscountCodes } from "../app/utils/cart-code.ts";

test("merges a new discount with existing cart codes", () => {
  assert.deepEqual(mergeDiscountCodes(["WELCOME"], "VIP"), ["WELCOME", "VIP"]);
});

test("does not duplicate an existing discount code", () => {
  assert.deepEqual(mergeDiscountCodes(["WELCOME"], "welcome"), ["WELCOME"]);
});
