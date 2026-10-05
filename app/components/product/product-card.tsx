import { mapSelectedProductOptionToObject } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import type {
  ProductCardFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";
import { ProductCardWishlistButton } from "~/components/wishlist/product-card-wishlist-button";
import {
  DESKTOP_MIN_PX,
  minWidthQuery,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";
import { isCombinedListing } from "~/utils/combined-listings";
import { calculateAspectRatio } from "~/utils/image";
import { ProductCardBadges } from "./badges";
import { ProductCardOptions } from "./product-card-options";
import { getProductCardPriceDisplay } from "./product-card-price";
import { ProductCardRating } from "./product-card-rating";
import { QuickShopTrigger } from "./quick-shop";
import { useCombinedPriceRange } from "./use-combined-price-range";
import { SpacedMoney, VariantPrices } from "./variant-prices";

const CONTENT_ALIGNMENT_CLASSES = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

const CONTENT_JUSTIFY_CLASSES = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

const BADGE_POSITION_CLASSES = {
  "top-left": "left-5",
  "top-center": "left-1/2 -translate-x-1/2",
  "top-right": "right-5",
} as const;

type ProductCardProps = {
  product: ProductCardFragment;
  className?: string;
  contentAlignment?: keyof typeof CONTENT_ALIGNMENT_CLASSES;
  quickShopIconOnly?: boolean;
  quickShopIconOnlyOnTablet?: boolean;
  stretchImageOnTablet?: boolean;
  mobileLayout?: boolean;
};

export function ProductCard({
  product,
  className,
  contentAlignment,
  quickShopIconOnly = false,
  quickShopIconOnlyOnTablet = false,
  stretchImageOnTablet = false,
  mobileLayout = false,
}: ProductCardProps) {
  const { t } = useTranslation();
  const {
    pcardTabletRatingLayout = "stacked",
    pcardBackgroundColor,
    pcardImageRatio,
    pcardHoverPadding = 20,
    pcardImageZoom = true,
    pcardHoverZoom = 105,
    pcardFontSize = 14,
    pcardContentGap = 12,
    pcardImageContentGap = 20,
    pcardAlignment,
    pcardShowVendor,
    pcardEnableQuickShop,
    pcardEnableWishlist,
    pcardBadgesPosition,
    pcardShowSaleBadges,
    pcardShowBestSellerBadges,
    pcardShowNewBadges,
    pcardShowOutOfStockBadges,
    pcardShowQuickShopOnHover,
    pcardShowBundleBadge,
    pcardShowBadgesOnMobile,
    pcardShowRating,
    pcardShowLowestPrice,
    pcardShowCombinedPriceRange = true,
    pcardShowSalePrice = true,
  } = useThemeSettings();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const { images } = product;
  const combined = isCombinedListing(product);
  const shouldLoadCombinedRange =
    combined &&
    pcardShowLowestPrice === true &&
    pcardShowCombinedPriceRange === true;
  const { range: combinedPriceRange, isLoading: isCombinedPriceLoading } =
    useCombinedPriceRange(product.id, shouldLoadCombinedRange);
  const priceRange = combinedPriceRange ?? product.priceRange;
  const { minVariantPrice, maxVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const activeVariant = selectedVariant || firstVariant;
  const priceDisplay = getProductCardPriceDisplay({
    priceRange,
    combined,
    showLowestPrice: pcardShowLowestPrice === true,
    showCombinedPriceRange: pcardShowCombinedPriceRange === true,
    hasActiveVariant: Boolean(activeVariant),
    waitingForCombinedPrice: isCombinedPriceLoading,
  });
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(activeVariant?.selectedOptions || []),
  );
  const query = params.toString();
  const productPath = `/products/${product.handle}${query ? `?${query}` : ""}`;

  const useTabletCoverImage = stretchImageOnTablet || quickShopIconOnlyOnTablet;

  const alignment = contentAlignment || pcardAlignment || "left";
  const tabletRatingLayout = pcardTabletRatingLayout || "stacked";
  const tabletRow = {
    split:
      "min-[896px]:flex-row min-[896px]:items-baseline min-[896px]:justify-between",
    inline: "md:flex-row md:items-baseline md:justify-between",
    stacked: "",
  }[tabletRatingLayout as "split" | "inline" | "stacked"];
  const tabletRating = {
    split: "min-[896px]:order-none min-[896px]:ml-auto",
    inline: "md:order-none md:ml-auto",
    stacked: "",
  }[tabletRatingLayout as "split" | "inline" | "stacked"];
  const badgePosition = pcardBadgesPosition || "top-left";
  const primaryImage = selectedVariant?.image || images.nodes[0];
  const hoverZoom = Number(pcardHoverZoom);
  const productCardBorderRadius = "var(--pcard-radius)";

  return (
    <article
      className={clsx(
        "group/product-card @container/product-card overflow-hidden p-5 bg-(--pcard-background) transition-colors duration-300",
        !mobileLayout &&
          "desktop:px-0 desktop:pt-0 desktop:gap-0 desktop:hover:bg-(--pcard-hover-background) desktop:focus-within:bg-(--pcard-hover-background)",
        className,
      )}
      style={
        {
          "--pcard-background": pcardBackgroundColor || "transparent",
          "--pcard-hover-background": "var(--pcard-hover-background-default)",
          "--pcard-hover-padding": `${pcardHoverPadding}px`,
          "--pcard-hover-zoom": Number.isFinite(hoverZoom)
            ? Math.min(150, Math.max(100, hoverZoom)) / 100
            : 1.05,
          "--pcard-font-size": `${pcardFontSize}px`,
          "--pcard-content-gap": `${pcardContentGap}px`,
          "--pcard-image-content-gap": `${pcardImageContentGap}px`,
          // Transfer image spacing below the info so hover cannot resize the card.
          "--pcard-hover-info-top":
            "max(0px, calc(var(--pcard-image-content-gap) - var(--pcard-hover-padding)))",
          "--pcard-hover-info-bottom":
            "min(var(--pcard-image-content-gap), var(--pcard-hover-padding))",
          "--pcard-radius": "var(--pcard-border-radius-default)",
          "--pcard-image-ratio": calculateAspectRatio(
            primaryImage,
            pcardImageRatio,
          ),
          borderRadius: productCardBorderRadius,
        } as React.CSSProperties
      }
    >
      <div
        className={clsx(
          "group relative aspect-(--pcard-image-ratio)",
          useTabletCoverImage && "md:w-full md:self-stretch lg:self-auto",
        )}
      >
        <div
          data-product-card-image-frame
          style={{ borderRadius: productCardBorderRadius }}
          className={clsx(
            "absolute inset-0 transition-[inset] duration-300",
            !mobileLayout &&
              "desktop:group-hover/product-card:inset-(--pcard-hover-padding) desktop:group-focus-within/product-card:inset-(--pcard-hover-padding)",
          )}
        >
          <Link
            to={productPath}
            prefetch="intent"
            aria-label={t("product.viewProduct", { product: product.title })}
            style={{ borderRadius: productCardBorderRadius }}
            className={clsx(
              "group relative block h-full w-full overflow-hidden bg-gray-100",
              useTabletCoverImage &&
                "md:w-full md:self-stretch md:bg-[lightgray] lg:bg-gray-100",
            )}
          >
            {primaryImage ? (
              <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                <Image
                  key={primaryImage.id}
                  className={clsx(
                    "h-full w-full [&>img]:transition-transform [&>img]:duration-300",
                    pcardImageZoom &&
                      !mobileLayout &&
                      "desktop:group-hover/product-card:[&>img]:scale-(--pcard-hover-zoom) desktop:group-focus-within/product-card:[&>img]:scale-(--pcard-hover-zoom)",
                  )}
                  sizes={`${minWidthQuery(DESKTOP_MIN_PX)} 25vw, ${minWidthQuery(TABLET_MIN_PX)} 30vw, 45vw`}
                  data={primaryImage}
                  width={700}
                  alt={
                    primaryImage.altText ||
                    t("product.pictureOf", { product: product.title })
                  }
                  loading="lazy"
                />
              </div>
            ) : (
              <span
                role="img"
                aria-label={t("product.imageUnavailableFor", {
                  product: product.title,
                })}
                className="absolute inset-0 flex items-center justify-center px-4 text-body-subtle text-sm"
              >
                {t("product.imageUnavailable")}
              </span>
            )}
          </Link>
          {pcardEnableWishlist && (
            <ProductCardWishlistButton
              productId={product.id}
              productTitle={product.title}
              className="top-[13px]"
            />
          )}
          <div
            className={clsx(
              "pointer-events-none absolute top-5 z-10 max-w-[calc(100%_-_2.5rem)] flex-wrap gap-1",
              pcardShowBadgesOnMobile ? "flex" : "hidden lg:flex",
              BADGE_POSITION_CLASSES[
                badgePosition as keyof typeof BADGE_POSITION_CLASSES
              ],
            )}
          >
            <ProductCardBadges
              product={product}
              selectedVariant={selectedVariant}
              showBundle={pcardShowBundleBadge}
              showSale={pcardShowSaleBadges}
              showBestSeller={pcardShowBestSellerBadges}
              showNew={pcardShowNewBadges}
              showSoldOut={pcardShowOutOfStockBadges}
            />
          </div>
          {pcardEnableQuickShop && (
            <QuickShopTrigger
              productHandle={product.handle}
              selectedOptions={activeVariant?.selectedOptions}
              iconOnly={mobileLayout || quickShopIconOnly}
              showOnHover={
                quickShopIconOnly ? false : pcardShowQuickShopOnHover
              }
            />
          )}
        </div>
      </div>
      <div
        className={clsx(
          "flex flex-col gap-(--pcard-content-gap) pt-(--pcard-image-content-gap) pb-0",
          !mobileLayout &&
            "desktop:px-5 transition-[padding] duration-300 desktop:group-hover/product-card:pt-(--pcard-hover-info-top) desktop:group-hover/product-card:pb-(--pcard-hover-info-bottom) desktop:group-focus-within/product-card:pt-(--pcard-hover-info-top) desktop:group-focus-within/product-card:pb-(--pcard-hover-info-bottom)",
          quickShopIconOnlyOnTablet && "self-stretch text-left",
          CONTENT_ALIGNMENT_CLASSES[
            alignment as keyof typeof CONTENT_ALIGNMENT_CLASSES
          ],
        )}
      >
        {pcardShowVendor && (
          <div className="text-body-subtle text-xs uppercase">
            {product.vendor}
          </div>
        )}
        <ProductCardOptions
          product={product}
          selectedVariant={activeVariant}
          setSelectedVariant={setSelectedVariant}
          className={
            CONTENT_JUSTIFY_CLASSES[
              alignment as keyof typeof CONTENT_JUSTIFY_CLASSES
            ]
          }
        />
        <div
          className={clsx(
            "flex w-full flex-col gap-(--pcard-content-gap)",
            CONTENT_ALIGNMENT_CLASSES[
              alignment as keyof typeof CONTENT_ALIGNMENT_CLASSES
            ],
          )}
        >
          <div
            className={clsx(
              "flex w-full flex-col gap-(--pcard-content-gap)",
              !mobileLayout &&
                "desktop:flex-row desktop:items-baseline desktop:justify-between",
              !mobileLayout && tabletRow,
              CONTENT_ALIGNMENT_CLASSES[
                alignment as keyof typeof CONTENT_ALIGNMENT_CLASSES
              ],
            )}
          >
            <NavLink
              to={productPath}
              prefetch="intent"
              className={({ isTransitioning }) =>
                clsx(
                  "line-clamp-2 font-body font-normal text-(--color-text) text-sm uppercase text-(length:--pcard-font-size) leading-none tracking-[0.02em]",
                  !mobileLayout && "desktop:min-w-0 desktop:flex-1",
                  isTransitioning && "[view-transition-name:product-image]",
                )
              }
            >
              {product.title}
            </NavLink>
            {pcardShowRating && (
              <ProductCardRating
                useDotDecimal
                className={clsx(
                  "order-first font-body text-(--color-text) text-(length:--pcard-font-size)",
                  !mobileLayout && "desktop:order-none desktop:ml-auto",
                  !mobileLayout && tabletRating,
                )}
                ratingValue={product.reviewRating?.value}
                ratingCountValue={product.reviewRatingCount?.value}
              />
            )}
          </div>
          {priceDisplay === "loading" ? (
            <div
              aria-hidden="true"
              className="h-[1em] text-(length:--pcard-font-size)"
            />
          ) : priceDisplay !== "variant" ? (
            <div className="flex flex-wrap items-center gap-x-1 font-body font-normal text-(--color-text) text-sm text-(length:--pcard-font-size) leading-none tracking-[0.02em]">
              {priceDisplay !== "single" && <span>{t("product.from")}</span>}
              <SpacedMoney data={minVariantPrice} />
              {priceDisplay === "range" && (
                <>
                  <span>–</span>
                  <SpacedMoney data={maxVariantPrice} />
                </>
              )}
            </div>
          ) : (
            <VariantPrices
              compareAtFirst
              spacedCurrency
              variant={activeVariant}
              showCompareAtPrice={pcardShowSalePrice}
              className={clsx(
                "flex-wrap gap-1 font-body font-normal text-sm text-(length:--pcard-font-size) leading-none tracking-[0.02em]",
                CONTENT_JUSTIFY_CLASSES[
                  alignment as keyof typeof CONTENT_JUSTIFY_CLASSES
                ],
              )}
              compareAtPriceClassName="text-(--color-compare-price-text) line-through"
              priceClassName="text-(--color-text)"
            />
          )}
        </div>
      </div>
    </article>
  );
}
