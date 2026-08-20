/**
 * Loyalty is an integration-ready hint, not a full rewards program.
 * Points are estimated from a merchant-configured rate until a vendor
 * such as LoyaltyLion is wired through `loadLoyaltyBalance`.
 */
export function estimateLoyaltyPoints(
  amount: number | string | null | undefined,
  pointsPerCurrency: number | string | null | undefined,
) {
  const price = Number.parseFloat(String(amount ?? ""));
  const rate = Number.parseFloat(String(pointsPerCurrency ?? ""));

  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    return 0;
  }

  return Math.max(0, Math.floor(price * rate));
}
