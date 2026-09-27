import { useMoney } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import type {
  ProductCardFragment,
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { cn } from "~/utils/cn";

function Badge({
  text,
  backgroundColor,
  textColor,
  className,
  variant,
}: {
  text: string;
  backgroundColor: string;
  textColor: string;
  className?: string;
  variant?: "sale" | "new";
}) {
  const { badgeTextTransform } = useTranslatedThemeSettings();
  return (
    <span
      style={{
        backgroundColor,
        color: textColor,
        borderRadius: "var(--badge-radius, var(--radius-xs))",
        textTransform: badgeTextTransform,
      }}
      className={cn(
        "whitespace-nowrap px-3 py-1",
        variant
          ? "inline-flex items-center gap-2 font-dm-sans font-semibold text-sm not-italic leading-none tracking-[0.28px]"
          : "font-bold text-xs leading-[14px]",
        className,
      )}
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
  const { newBadgeText, newBadgeDaysOld } = useTranslatedThemeSettings();
  if (isNewArrival(publishedAt, newBadgeDaysOld)) {
    return (
      <Badge
        text={newBadgeText}
        variant="new"
        backgroundColor="var(--color-new-badge, #E3DAD4)"
        textColor="var(--color-text-subtle, #524B46)"
        className={clsx("new-badge", className)}
      />
    );
  }
  return null;
}

export function BestSellerBadge({ className }: { className?: string }) {
  const { bestSellerBadgeText } = useTranslatedThemeSettings();
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
  const { soldOutBadgeText } = useTranslatedThemeSettings();
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
  const { bundleBadgeText } = useTranslatedThemeSettings();
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
  const translateText = useTranslatedText();

  const { saleBadgeText: rawI18nSaleBadgeText = "Sale" } =
    useTranslatedThemeSettings();
  const saleBadgeText = translateText(
    rawI18nSaleBadgeText,
    "themeContent.componentsProductBadges.saleBadgeText",
  );
  const { amount, percentage } = calculateDiscount(price, compareAtPrice);
  const discountAmount = useMoney({ amount, currencyCode: price.currencyCode });
  const text = saleBadgeText
    .replace("[amount]", discountAmount.withoutTrailingZeros)
    .replace("[percentage]", percentage);

  if (percentage !== "0") {
    return (
      <Badge
        text={text}
        variant="sale"
        backgroundColor="var(--color-discount, #573B3B)"
        textColor="var(--color-text-inverse, #FEF4EB)"
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
          <NewBadge publishedAt={publishedAt} />
          <SaleBadge
            price={selectedVariant.price as MoneyV2}
            compareAtPrice={selectedVariant.compareAtPrice as MoneyV2}
          />
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

  const isSoldOut = !variant?.availableForSale;

  if (isSoldOut) {
    return showSoldOut ? <SoldOutBadge className={className} /> : null;
  }

  return (
    <div
      className={cn("flex items-center gap-1 text-sm empty:hidden", className)}
    >
      {showBundle && isBundle && <BundleBadge />}

      {showSale && variant && (
        <SaleBadge
          price={variant.price as MoneyV2}
          compareAtPrice={variant.compareAtPrice as MoneyV2}
        />
      )}

      {showNew && <NewBadge publishedAt={publishedAt} />}

      {showBestSeller && isBestSellerProduct && <BestSellerBadge />}
    </div>
  );
}
