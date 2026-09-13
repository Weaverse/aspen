type RequestedLine = {
  merchandiseId: string;
  quantity?: number;
  selectedVariant?: { quantityAvailable?: number | null };
};

/** Sum all cart lines for a variant, including different selling plans. */
export function exceedsAvailableInventory(
  requestedLines: RequestedLine[],
  cartLines: { merchandise: { id: string }; quantity: number }[],
) {
  return requestedLines.some((line) => {
    const available = line.selectedVariant?.quantityAvailable;
    // Missing/negative inventory and zero-stock backorders have no known cap.
    if (typeof available !== "number" || available <= 0) {
      return false;
    }
    const inCart = cartLines.reduce(
      (sum, item) =>
        sum + (item.merchandise.id === line.merchandiseId ? item.quantity : 0),
      0,
    );
    const requested = requestedLines.reduce(
      (sum, item) =>
        sum +
        (item.merchandiseId === line.merchandiseId ? item.quantity || 0 : 0),
      0,
    );
    return inCart + requested > available;
  });
}
