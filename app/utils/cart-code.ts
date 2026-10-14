export function mergeDiscountCodes(existingCodes: string[], code: string) {
  const normalizedCode = code.toLowerCase();
  return existingCodes.some(
    (existingCode) => existingCode.toLowerCase() === normalizedCode,
  )
    ? existingCodes
    : [...existingCodes, code];
}
export const CART_CODE_APPLY_ACTION = "CartCodeApply";
export function uppercaseCartCode(code: string) {
  return code.toUpperCase();
}
