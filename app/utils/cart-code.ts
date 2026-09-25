export function mergeDiscountCodes(existingCodes: string[], code: string) {
  const normalizedCode = code.toLowerCase();
  return existingCodes.some(
    (existingCode) => existingCode.toLowerCase() === normalizedCode,
  )
    ? existingCodes
    : [...existingCodes, code];
}
