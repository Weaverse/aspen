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
import { ProductCardRating } from "./product-card-rating";
import { QuickShopTrigger } from "./quick-shop";
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
  quickShopIconOnly?: boolean;
  quickShopIconOnlyOnTablet?: boolean;
  stretchImageOnTablet?: boolean;
};

export function ProductCard({
  product,
  className,
  quickShopIconOnly = false,
  quickShopIconOnlyOnTablet = false,
  stretchImageOnTablet = false,
}: ProductCardProps) {
  const { t } = useTranslation();
  const {
    pcardBackgroundColor,
    pcardHoverBackgroundColor,
    pcardImageRatio,
    pcardBorderRadius = 8,
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
    pcardShowSalePrice = true,
  } = useThemeSettings();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const { images, priceRange } = product;
  const { minVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const activeVariant = selectedVariant || firstVariant;
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(activeVariant?.selectedOptions || []),
  );
  const query = params.toString();
  const productPath = `/products/${product.handle}${query ? `?${query}` : ""}`;

  const useTabletCoverImage = stretchImageOnTablet || quickShopIconOnlyOnTablet;

  const alignment = pcardAlignment || "left";
  const badgePosition = pcardBadgesPosition || "top-left";
  const primaryImage = selectedVariant?.image || images.nodes[0];
  const activeImage = primaryImage;

  return (
    <article
      className={clsx(
        "group/product-card @container/product-card overflow-hidden rounded-(--pcard-radius) bg-(--pcard-background) transition-[padding,background-color] duration-300",
        "desktop:hover:bg-(--pcard-hover-background) desktop:hover:p-4 desktop:focus-within:bg-(--pcard-hover-background) desktop:focus-within:p-4",
        className,
      )}
      style={
        {
          "--pcard-background": pcardBackgroundColor || "transparent",
          "--pcard-hover-background": pcardHoverBackgroundColor || "#F1F1F1",
          "--pcard-radius": `${pcardBorderRadius}px`,
          "--pcard-image-ratio": calculateAspectRatio(
            primaryImage,
            pcardImageRatio,
          ),
        } as React.CSSProperties
      }
    >
      <div
        className={clsx(
          "group relative",
          useTabletCoverImage && "md:w-full md:self-stretch lg:self-auto",
        )}
      >
        <Link
          to={productPath}
          prefetch="intent"
          aria-label={t("product.viewProduct", { product: product.title })}
          className={clsx(
            "group relative block aspect-(--pcard-image-ratio) overflow-hidden rounded-(--pcard-radius) bg-gray-100",
            useTabletCoverImage &&
              "md:w-full md:self-stretch md:bg-[lightgray] lg:bg-gray-100",
          )}
        >
          {activeImage ? (
            <Image
              key={activeImage.id}
              className={clsx(
                "absolute inset-0 h-full w-full object-cover object-[50%_50%] transition-transform duration-300 group-hover:scale-105",
              )}
              sizes={`${minWidthQuery(DESKTOP_MIN_PX)} 25vw, ${minWidthQuery(TABLET_MIN_PX)} 30vw, 45vw`}
              data={activeImage}
              width={700}
              alt={
                activeImage.altText ||
                t("product.pictureOf", { product: product.title })
              }
              loading="lazy"
            />
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
            iconOnly={quickShopIconOnly}
            showOnHover={quickShopIconOnly ? false : pcardShowQuickShopOnHover}
          />
        )}
      </div>
      <div
        className={clsx(
          "flex flex-col items-start gap-3 pt-5 pb-3",
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
            "flex w-full flex-col gap-3",
            CONTENT_ALIGNMENT_CLASSES[
              alignment as keyof typeof CONTENT_ALIGNMENT_CLASSES
            ],
          )}
        >
          <div
            className={clsx(
              "flex w-full flex-col gap-3",
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
                  "line-clamp-2 font-body font-normal text-(--color-text) text-sm uppercase",
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
              />
            )}
          </div>
          {isCombinedListing(product) || !activeVariant ? (
            <div className="font-body font-normal text-(--color-text) text-sm">
              <SpacedMoney data={minVariantPrice} />
            </div>
          ) : (
            <VariantPrices
              compareAtFirst
              spacedCurrency
              variant={activeVariant}
              showCompareAtPrice={pcardShowSalePrice}
              className={clsx(
                "flex-wrap gap-1 font-body font-normal text-sm",
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
