export function normalizeGiftCardCode(code: string) {
  return code.replace(/\s/g, "");
}
