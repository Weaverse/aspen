import { useMoney } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import type {
  ProductCardFragment,
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { cn } from "~/utils/cn";

function Badge({
  text,
  backgroundColor,
  textColor,
  className,
}: {
  text: string;
  backgroundColor: string;
  textColor: string;
  className?: string;
}) {
  const { badgeTextTransform } = useThemeSettings();
  return (
    <span
      style={{
        backgroundColor,
        color: textColor,
        borderRadius: "var(--radius-xs)",
        textTransform: badgeTextTransform,
      }}
      className={cn("px-2 py-1 text-sm uppercase", className)}
    >
      {text}
    </span>
  );
}

export function NewBadge({
  publishedAt,
  className,
}: {
  publishedAt: string;
  className?: string;
}) {
  const { newBadgeText, newBadgeDaysOld } = useThemeSettings();
  if (isNewArrival(publishedAt, newBadgeDaysOld)) {
    return (
      <Badge
        text={newBadgeText}
        backgroundColor="var(--color-new-badge)"
        textColor="var(--color-text)"
        className={clsx("new-badge", className)}
      />
    );
  }
  return null;
}

export function BestSellerBadge({ className }: { className?: string }) {
  const { bestSellerBadgeText } = useThemeSettings();
  return (
    <Badge
      text={bestSellerBadgeText}
      backgroundColor="var(--color-best-seller)"
      textColor="var(--color-text-inverse)"
      className={clsx("best-seller-badge", className)}
    />
  );
}

export function SoldOutBadge({ className }: { className?: string }) {
  const { soldOutBadgeText } = useThemeSettings();
  return (
    <Badge
      text={soldOutBadgeText}
      backgroundColor="var(--color-sold-out-and-unavailable)"
      textColor="var(--color-text)"
      className={clsx("sold-out-badge", className)}
    />
  );
}

export function BundleBadge({ className }: { className?: string }) {
  const { bundleBadgeText } = useThemeSettings();
  return (
    <Badge
      text={bundleBadgeText}
      backgroundColor="var(--color-bundle-badge)"
      textColor="var(--color-text-inverse)"
      className={clsx("bundle-badge", className)}
    />
  );
}

export function SaleBadge({
  price,
  compareAtPrice,
  className,
}: {
  price: MoneyV2;
  compareAtPrice: MoneyV2;
  className?: string;
}) {
  const { saleBadgeText = "Sale" } = useThemeSettings();
  const { amount, percentage } = calculateDiscount(price, compareAtPrice);
  const discountAmount = useMoney({ amount, currencyCode: price.currencyCode });
  const text = saleBadgeText
    .replace("[amount]", discountAmount.withoutTrailingZeros)
    .replace("[percentage]", percentage);

  if (percentage !== "0") {
    return (
      <Badge
        text={text}
        backgroundColor="var(--color-discount)"
        textColor="var(--color-text-inverse)"
        className={clsx("sale-badge", className)}
      />
    );
  }
  return null;
}

function calculateDiscount(price: MoneyV2, compareAtPrice: MoneyV2) {
  if (price?.amount && compareAtPrice?.amount) {
    const priceNumber = Number(price.amount);
    const compareAtPriceNumber = Number(compareAtPrice.amount);
    if (compareAtPriceNumber > priceNumber) {
      return {
        amount: String(compareAtPriceNumber - priceNumber),
        percentage: Math.round(
          ((compareAtPriceNumber - priceNumber) / compareAtPriceNumber) * 100,
        ).toString(),
      };
    }
  }
  return { amount: "0", percentage: "0" };
}

function isNewArrival(date: string, daysOld = 30) {
  return (
    new Date(date).valueOf() >
    new Date().setDate(new Date().getDate() - daysOld).valueOf()
  );
}

export function ProductBadges({
  product,
  selectedVariant,
  className = "",
}: {
  product: NonNullable<ProductQuery["product"]>;
  selectedVariant: ProductVariantFragment;
  className?: string;
}) {
  if (!(product && selectedVariant)) {
    return null;
  }

  const isBundle = Boolean(product?.isBundle?.requiresComponents);
  const { publishedAt, badges } = product;
  const isBestSellerProduct = badges
    .filter(Boolean)
    .some(({ key, value }) => key === "best_seller" && value === "true");

  return (
    <div
      className={cn("flex items-center gap-2 text-sm empty:hidden", className)}
    >
      {selectedVariant.availableForSale ? (
        <>
          {isBundle && <BundleBadge />}
          <SaleBadge
            price={selectedVariant.price as MoneyV2}
            compareAtPrice={selectedVariant.compareAtPrice as MoneyV2}
          />
          <NewBadge publishedAt={publishedAt} />
          {isBestSellerProduct && <BestSellerBadge />}
        </>
      ) : (
        <SoldOutBadge />
      )}
    </div>
  );
}

export function ProductCardBadges({
  product,
  selectedVariant,
  className = "",
  showBundle = true,
  showSale = true,
  showBestSeller = true,
  showNew = true,
  showSoldOut = true,
}: {
  product: ProductCardFragment;
  selectedVariant?: ProductVariantFragment | null;
  className?: string;
  showBundle?: boolean;
  showSale?: boolean;
  showBestSeller?: boolean;
  showNew?: boolean;
  showSoldOut?: boolean;
}) {
  if (!product) {
    return null;
  }

  const variant = selectedVariant || product.selectedOrFirstAvailableVariant;
  const isBundle = Boolean(product?.isBundle?.requiresComponents);
  const { publishedAt, badges } = product;

  const isBestSellerProduct = badges
    .filter(Boolean)
    .some(({ key, value }) => key === "best_seller" && value === "true");

  // Check if product is sold out (no available variants)
  const isSoldOut = !product.selectedOrFirstAvailableVariant?.availableForSale;

  return (
    <div
      className={cn("flex items-center gap-1 text-sm empty:hidden", className)}
    >
      {showBundle && isBundle && <BundleBadge />}

      {showSale && !isSoldOut && variant && (
        <SaleBadge
          price={variant.price as MoneyV2}
          compareAtPrice={variant.compareAtPrice as MoneyV2}
        />
      )}

      {showNew && <NewBadge publishedAt={publishedAt} />}

      {showBestSeller && isBestSellerProduct && <BestSellerBadge />}

      {showSoldOut && isSoldOut && <SoldOutBadge />}
    </div>
  );
}
