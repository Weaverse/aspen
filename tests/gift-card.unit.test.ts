import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGiftCardCode } from "../app/utils/gift-card.ts";

test("normalizes whitespace in gift card codes", () => {
  assert.equal(normalizeGiftCardCode("ABCD 1234 5678"), "ABCD12345678");
});
