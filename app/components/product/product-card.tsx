import { Money, mapSelectedProductOptionToObject } from "@shopify/hydrogen";
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
import { isCombinedListing } from "~/utils/combined-listings";
import { calculateAspectRatio } from "~/utils/image";
import { ProductCardBadges } from "./badges";
import { ProductCardOptions } from "./product-card-options";
import { ProductCardRating } from "./product-card-rating";
import { QuickShopTrigger } from "./quick-shop";
import { VariantPrices } from "./variant-prices";

const CONTENT_ALIGNMENT_CLASSES = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

const OPTION_ALIGNMENT_CLASSES = {
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
};

type ProductCardImage = ProductCardFragment["images"]["nodes"][number];

function getCardImages(
  images: ProductCardImage[],
  selectedImage?: ProductVariantFragment["image"],
) {
  const primaryImage = selectedImage || images[0];
  const secondaryImage = images.find(
    (image) => image.id !== primaryImage?.id && image.url !== primaryImage?.url,
  );

  return { primaryImage, secondaryImage };
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { t } = useTranslation();
  const {
    pcardBorderRadius,
    pcardBackgroundColor,
    pcardHoverBackgroundColor,
    pcardShowImageOnHover,
    pcardImageRatio,
    pcardTitlePricesAlignment,
    pcardAlignment,
    pcardShowVendor,
    pcardShowLowestPrice,
    pcardShowSalePrice,
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
    designSystemPreset,
  } = useThemeSettings();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const { images, priceRange } = product;
  const { minVariantPrice, maxVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const activeVariant = selectedVariant || firstVariant;
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(activeVariant?.selectedOptions || []),
  );
  const query = params.toString();
  const productPath = `/products/${product.handle}${query ? `?${query}` : ""}`;

  const isVertical = pcardTitlePricesAlignment === "vertical";
  const alignment = pcardAlignment || "left";
  const badgePosition = pcardBadgesPosition || "top-left";
  const { primaryImage, secondaryImage } = getCardImages(
    images.nodes,
    selectedVariant?.image,
  );

  return (
    <article
      className={clsx(
        "group/product-card @container/product-card overflow-hidden rounded-(--pcard-radius) bg-(--pcard-background) transition-[padding,background-color] duration-300",
        "lg:hover:bg-(--pcard-hover-background) lg:hover:p-4 lg:focus-within:bg-(--pcard-hover-background) lg:focus-within:p-4",
        className,
      )}
      style={
        {
          "--pcard-background": pcardBackgroundColor || "transparent",
          "--pcard-hover-background": pcardHoverBackgroundColor || "#F1F1F1",
          "--pcard-radius":
            designSystemPreset === "custom"
              ? `${pcardBorderRadius}px`
              : "var(--radius-md)",
          "--pcard-image-ratio": calculateAspectRatio(
            primaryImage,
            pcardImageRatio,
          ),
        } as React.CSSProperties
      }
    >
      <div className="group relative">
        <Link
          to={productPath}
          prefetch="intent"
          aria-label={t("product.viewProduct", { product: product.title })}
          className="group relative block aspect-(--pcard-image-ratio) overflow-hidden rounded-(--pcard-radius) bg-gray-100"
        >
          {primaryImage ? (
            <>
              <Image
                className={clsx(
                  "absolute inset-0",
                  pcardShowImageOnHover &&
                    secondaryImage &&
                    "transition-opacity duration-300 group-hover:opacity-0",
                )}
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                data={primaryImage}
                width={700}
                alt={
                  primaryImage.altText ||
                  t("product.pictureOf", { product: product.title })
                }
                loading="lazy"
              />
              {pcardShowImageOnHover && secondaryImage && (
                <Image
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                  width={700}
                  data={secondaryImage}
                  alt=""
                  loading="lazy"
                />
              )}
            </>
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
            showOnHover={pcardShowQuickShopOnHover}
          />
        )}
      </div>
      <div
        className={clsx(
          "flex flex-col gap-2 py-3",
          isVertical &&
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
            isVertical
              ? OPTION_ALIGNMENT_CLASSES[
                  alignment as keyof typeof OPTION_ALIGNMENT_CLASSES
                ]
              : undefined
          }
        />
        {isVertical ? (
          <div className="flex w-full flex-col gap-1">
            <div className="flex flex-col gap-1 @min-[18rem]/product-card:flex-row @min-[18rem]/product-card:items-start @min-[18rem]/product-card:justify-between">
              <NavLink
                to={productPath}
                prefetch="intent"
                className={({ isTransitioning }) =>
                  clsx(
                    "order-2 line-clamp-2 text-sm uppercase leading-tight @min-[18rem]/product-card:order-1",
                    isTransitioning && "[view-transition-name:product-image]",
                  )
                }
              >
                {product.title}
              </NavLink>
              {pcardShowRating && (
                <ProductCardRating
                  ratingValue={product.reviewRating?.value}
                  ratingCountValue={product.reviewRatingCount?.value}
                  className="order-1 @min-[18rem]/product-card:order-2"
                />
              )}
            </div>
            {pcardShowLowestPrice || isCombinedListing(product) ? (
              <div className="flex flex-wrap items-center gap-x-1 text-sm">
                <span>{t("product.from")}</span>
                <Money withoutTrailingZeros data={minVariantPrice} />
                {isCombinedListing(product) && (
                  <>
                    <span>–</span>
                    <Money withoutTrailingZeros data={maxVariantPrice} />
                  </>
                )}
              </div>
            ) : (
              <VariantPrices
                variant={activeVariant}
                showCompareAtPrice={pcardShowSalePrice}
                className="flex-wrap text-sm"
              />
            )}
          </div>
        ) : (
          <>
            {pcardShowRating && (
              <ProductCardRating
                ratingValue={product.reviewRating?.value}
                ratingCountValue={product.reviewRatingCount?.value}
              />
            )}
            <div className="flex w-full flex-col items-start gap-1 text-left lg:flex-row lg:justify-between lg:gap-4">
              <NavLink
                to={productPath}
                prefetch="intent"
                className={({ isTransitioning }) =>
                  clsx(
                    "line-clamp-2 text-sm uppercase leading-tight",
                    isTransitioning && "[view-transition-name:product-image]",
                  )
                }
              >
                {product.title}
              </NavLink>
              {pcardShowLowestPrice || isCombinedListing(product) ? (
                <div className="flex flex-wrap items-center gap-x-1 text-sm">
                  <span>{t("product.from")}</span>
                  <Money withoutTrailingZeros data={minVariantPrice} />
                  {isCombinedListing(product) && (
                    <>
                      <span>–</span>
                      <Money withoutTrailingZeros data={maxVariantPrice} />
                    </>
                  )}
                </div>
              ) : (
                <VariantPrices
                  variant={activeVariant}
                  showCompareAtPrice={pcardShowSalePrice}
                  className="flex-wrap text-sm lg:justify-end"
                />
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
