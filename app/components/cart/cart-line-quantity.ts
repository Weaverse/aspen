type QuantityLine = {
  id: string;
  quantity: number;
  merchandise: {
    id?: string;
    quantityAvailable?: number | null;
    currentlyNotInStock?: boolean;
    quantityRule?: {
      minimum: number;
      maximum?: number | null;
      increment: number;
    };
  };
};

export function getLineQuantityRules(line: QuantityLine) {
  const rule = line.merchandise.quantityRule;
  return {
    minimum: rule?.minimum ?? 1,
    maximum: rule?.maximum ?? null,
    increment: rule?.increment ?? 1,
  };
}

export function getNextLineQuantity(line: QuantityLine, direction: 1 | -1) {
  const { minimum, maximum, increment } = getLineQuantityRules(line);
  if (direction === 1) {
    return Math.max(
      minimum,
      (Math.floor(line.quantity / increment) + 1) * increment,
    );
  }
  if (line.quantity <= minimum) {
    return line.quantity;
  }
  return Math.max(
    minimum,
    Math.min(
      (Math.ceil(line.quantity / increment) - 1) * increment,
      maximum ?? Number.POSITIVE_INFINITY,
    ),
  );
}

export function getOtherVariantQuantity(
  line: QuantityLine,
  lines: QuantityLine[],
) {
  return lines.reduce(
    (total, other) =>
      other.id !== line.id &&
      line.merchandise.id &&
      other.merchandise.id === line.merchandise.id
        ? total + other.quantity
        : total,
    0,
  );
}

/**
 * Inventory is an optimistic-display boundary, not a purchase restriction:
 * Storefront doesn't expose the inventory policy for an in-stock variant.
 * Shopify must confirm increases past this boundary (including backorders).
 */
export function getOptimisticLineQuantity(
  line: QuantityLine,
  requested: number,
  lines: QuantityLine[],
) {
  if (requested <= line.quantity || line.merchandise.currentlyNotInStock) {
    return requested;
  }
  const stock = line.merchandise.quantityAvailable;
  if (typeof stock !== "number") {
    return line.quantity;
  }
  const otherQuantity = getOtherVariantQuantity(line, lines);
  const { minimum, maximum, increment } = getLineQuantityRules(line);
  const available = Math.min(
    stock - otherQuantity,
    maximum ?? Number.POSITIVE_INFINITY,
  );
  const validMaximum = Math.floor(available / increment) * increment;
  return Math.min(
    requested,
    Math.max(
      line.quantity,
      validMaximum >= minimum ? validMaximum : line.quantity,
    ),
  );
}
