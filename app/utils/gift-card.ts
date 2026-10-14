import { uppercaseCartCode } from "./cart-code.ts";

export function normalizeGiftCardCode(code: string) {
  return uppercaseCartCode(code.replace(/\s/g, ""));
}
