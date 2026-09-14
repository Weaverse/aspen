type GiftCardResult = {
  cart?: { appliedGiftCards?: Array<{ lastCharacters: string }> } | null;
  errors?: unknown;
  userErrors?: unknown[];
};

export function normalizeGiftCardCode(code: string) {
  return code.replace(/\s/g, "");
}

// Shopify validates the full code. A suffix match alone is not proof that
// the submitted code was accepted (an existing card can have the same suffix).
export function isGiftCardApplied(
  result: GiftCardResult | undefined,
  code: string,
) {
  const normalized = normalizeGiftCardCode(code).toLowerCase();
  const hasErrors = Array.isArray(result?.errors)
    ? result.errors.length > 0
    : Boolean(result?.errors);
  return Boolean(
    normalized &&
      !hasErrors &&
      !result?.userErrors?.length &&
      result?.cart?.appliedGiftCards?.some((card) =>
        normalized.endsWith(card.lastCharacters.toLowerCase()),
      ),
  );
}
