import { Money, mapSelectedProductOptionToObject } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useState } from "react";
import type {
  ProductCardFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";
import { isCombinedListing } from "~/utils/combined-listings";
import { calculateAspectRatio } from "~/utils/image";
import { ProductCardBadges } from "./badges";
import { ProductCardOptions } from "./product-card-options";
import { QuickShopTrigger } from "./quick-shop";
import { VariantPrices } from "./variant-prices";

const styleVariants = cva("", {
  variants: {
    alignment: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
});

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardFragment;
  className?: string;
}) {
  const {
    pcardBorderRadius,
    pcardBackgroundColor,
    pcardShowImageOnHover,
    pcardImageRatio,
    pcardTitlePricesAlignment,
    pcardAlignment,
    pcardShowVendor,
    pcardShowLowestPrice,
    pcardShowSalePrice,
    pcardEnableQuickShop,
    pcardQuickShopButtonType,
    pcardQuickShopButtonText,
    pcardQuickShopAction,
    pcardQuickShopPanelType,
    pcardBadgesPosition,
    pcardShowSaleBadges,
    pcardShowBestSellerBadges,
    pcardShowNewBadges,
    pcardShowOutOfStockBadges,
    pcardShowQuickShopOnHover,
    pcardShowBundleBadge,
  } = useThemeSettings();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const { images, badges, priceRange } = product;
  const { minVariantPrice, maxVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(
      (selectedVariant || firstVariant)?.selectedOptions || [],
    ),
  );

  const isVertical = pcardTitlePricesAlignment === "vertical";
  const isBundle = Boolean(product?.isBundle?.requiresComponents);

  // Helper function to get badge position classes
  const getBadgePositionClasses = (position = "top-right") => {
    switch (position) {
      case "top-left":
        return "flex gap-1 absolute top-2.5 left-2.5";
      case "top-center":
        return "flex gap-1 absolute top-2.5 left-1/2 -translate-x-1/2";
      default:
        return "flex gap-1 absolute top-2.5 right-2.5";
    }
  };

  let [image, secondImage] = images.nodes;
  if (selectedVariant?.image) {
    image = selectedVariant.image;
    const imageUrl = image.url;
    const imageIndex = images.nodes.findIndex(({ url }) => url === imageUrl);
    if (imageIndex > 0 && imageIndex < images.nodes.length - 1) {
      secondImage = images.nodes[imageIndex + 1];
    }
  }

  return (
    <div
      className={clsx(
        "group rounded-(--pcard-radius) border border-transparent transition-colors duration-300 hover:border-[#DBD7D1]",
        className,
      )}
      style={
        {
          backgroundColor: pcardBackgroundColor,
          "--pcard-radius": `${pcardBorderRadius}px`,
          "--pcard-image-ratio": calculateAspectRatio(image, pcardImageRatio),
        } as React.CSSProperties
      }
    >
      <div
        className="overflow-hidden rounded-(--pcard-radius) transition-transform duration-300 group-hover:scale-95"
        style={{ backgroundColor: pcardBackgroundColor }}
      >
        <div className="group relative">
          {image && (
            <Link
              to={`/products/${product.handle}?${params.toString()}`}
              prefetch="intent"
              className="group relative block aspect-(--pcard-image-ratio) overflow-hidden rounded-t-(--pcard-radius) bg-gray-100"
            >
              <Image
                className={clsx([
                  "absolute inset-0",
                  pcardShowImageOnHover &&
                    secondImage &&
                    "transition-opacity duration-300 group-hover:opacity-50",
                ])}
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                data={image}
                width={700}
                alt={image.altText || `Picture of ${product.title}`}
                loading="lazy"
              />
              {pcardShowImageOnHover && secondImage && (
                <Image
                  className={clsx([
                    "absolute inset-0",
                    "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  ])}
                  sizes="auto"
                  width={700}
                  data={secondImage}
                  alt={
                    secondImage.altText || `Second picture of ${product.title}`
                  }
                  loading="lazy"
                />
              )}
            </Link>
          )}
          <div className={getBadgePositionClasses(pcardBadgesPosition)}>
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
              showOnHover={pcardShowQuickShopOnHover}
              buttonType={pcardQuickShopButtonType}
              buttonText={pcardQuickShopButtonText}
              panelType={pcardQuickShopPanelType}
            />
          )}
        </div>
        <div
          className={clsx(
            "flex flex-col gap-2 py-3",
            isVertical && styleVariants({ alignment: pcardAlignment }),
          )}
        >
          {pcardShowVendor && (
            <div className="text-body-subtle uppercase">{product.vendor}</div>
          )}
          <div className="block md:hidden">
            <ProductCardOptions
              product={product}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
            />
          </div>
          <NavLink
            to={`/products/${product.handle}?${params.toString()}`}
            prefetch="intent"
            className={({ isTransitioning }) =>
              clsx(
                "font-bold",
                isTransitioning && "[view-transition-name:product-image]",
              )
            }
          >
            <span className="font-semibold uppercase">{product.title}</span>
          </NavLink>
          <div
            className={clsx(
              "flex",
              isVertical
                ? "title-and-price flex-col gap-1"
                : "justify-between gap-4",
            )}
          >
            {pcardShowLowestPrice || isCombinedListing(product) ? (
              <div className="flex gap-1">
                <span>From</span>
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
                variant={selectedVariant || firstVariant}
                showCompareAtPrice={pcardShowSalePrice}
              />
            )}
            <div className="hidden md:block">
              <ProductCardOptions
                product={product}
                selectedVariant={selectedVariant}
                setSelectedVariant={setSelectedVariant}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
