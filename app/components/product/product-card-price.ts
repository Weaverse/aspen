import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";

type PriceRange = {
  minVariantPrice: Pick<MoneyV2, "amount" | "currencyCode">;
  maxVariantPrice: Pick<MoneyV2, "amount" | "currencyCode">;
};

type ProductCardPriceDisplay =
  | "loading"
  | "variant"
  | "single"
  | "from"
  | "range";

export function getProductCardPriceDisplay({
  priceRange,
  combined,
  showLowestPrice,
  showCombinedPriceRange,
  hasActiveVariant,
  waitingForCombinedPrice = false,
}: {
  priceRange: PriceRange;
  combined: boolean;
  showLowestPrice: boolean;
  showCombinedPriceRange: boolean;
  hasActiveVariant: boolean;
  waitingForCombinedPrice?: boolean;
}): ProductCardPriceDisplay {
  if (waitingForCombinedPrice) {
    return "loading";
  }

  if (!combined && !showLowestPrice && hasActiveVariant) {
    return "variant";
  }

  const { minVariantPrice, maxVariantPrice } = priceRange;
  if (
    minVariantPrice.currencyCode === maxVariantPrice.currencyCode &&
    Number(minVariantPrice.amount) === Number(maxVariantPrice.amount)
  ) {
    return "single";
  }

  if (combined && showLowestPrice && showCombinedPriceRange) {
    return "range";
  }

  return "from";
}
