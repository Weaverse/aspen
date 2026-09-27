import { Money, useMoney } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import type { ProductVariantFragment } from "storefront-api.generated";
import { cn } from "~/utils/cn";
import { isDiscounted } from "~/utils/product";

/** Preserve locale currency placement with a consistent visual gap. */
export function SpacedMoney({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const { withoutTrailingZeros, currencySymbol, currencyNarrowSymbol } =
    useMoney(data);
  const displaySymbol = [currencySymbol, currencyNarrowSymbol].find(
    (symbol) => symbol && withoutTrailingZeros.includes(symbol),
  );
  if (!displaySymbol) {
    return (
      <span className={className}>
        {withoutTrailingZeros.replace(/[\s\u00a0\u202f]+/g, " ")}
      </span>
    );
  }
  const index = withoutTrailingZeros.indexOf(displaySymbol);
  const before = withoutTrailingZeros.slice(0, index).trimEnd();
  const after = withoutTrailingZeros
    .slice(index + displaySymbol.length)
    .trimStart();
  return (
    <span className={cn("whitespace-nowrap", className)}>
      {before}
      {before ? (
        <span aria-hidden="true" className="inline-block w-0.5" />
      ) : null}
      {displaySymbol}
      {after ? (
        <span aria-hidden="true" className="inline-block w-0.5" />
      ) : null}
      {after}
    </span>
  );
}

export function CompareAtPrice({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const { currencyNarrowSymbol, withoutTrailingZerosAndCurrency } =
    useMoney(data);
  return (
    <span className={cn("strike text-(--color-compare-price-text)", className)}>
      {currencyNarrowSymbol}
      {withoutTrailingZerosAndCurrency}
    </span>
  );
}

export function VariantPrices({
  variant,
  showCompareAtPrice = true,
  className,
  spacedCurrency = false,
  compareAtFirst = false,
  priceClassName,
  compareAtPriceClassName,
}: {
  spacedCurrency?: boolean;
  variant:
    | ProductVariantFragment
    | { price: Pick<MoneyV2, "amount" | "currencyCode"> };
  showCompareAtPrice?: boolean;
  className?: string;
  compareAtFirst?: boolean;
  priceClassName?: string;
  compareAtPriceClassName?: string;
}) {
  if (variant) {
    const { price } = variant;
    const compareAtPrice =
      "compareAtPrice" in variant ? variant.compareAtPrice : undefined;
    if (price) {
      const priceElement = spacedCurrency ? (
        <SpacedMoney className={priceClassName} data={price as MoneyV2} />
      ) : (
        <Money withoutTrailingZeros className={priceClassName} data={price} />
      );
      const compareAtPriceElement =
        showCompareAtPrice &&
        compareAtPrice &&
        isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) ? (
          spacedCurrency ? (
            <span className={cn("strike", compareAtPriceClassName)}>
              <SpacedMoney data={compareAtPrice as MoneyV2} />
            </span>
          ) : (
            <CompareAtPrice
              className={compareAtPriceClassName}
              data={compareAtPrice as MoneyV2}
            />
          )
        ) : null;

      return (
        <div className={cn("flex items-center gap-2", className)}>
          {compareAtFirst && compareAtPriceElement}
          {priceElement}
          {!compareAtFirst && compareAtPriceElement}
        </div>
      );
    }
  }
  return null;
}
