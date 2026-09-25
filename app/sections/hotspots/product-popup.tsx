import { ShoppingBagIcon } from "@phosphor-icons/react";
import type { MediaImage } from "@shopify/hydrogen/storefront-api-types";
import { IMAGES_PLACEHOLDERS, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { useState } from "react";
import type {
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { OPTIONS_AS_SWATCH } from "~/components/product/product-option-values";
import { SpacedMoney } from "~/components/product/variant-prices";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { isLightColor, isValidColor } from "~/utils/misc";
import { translatePreview } from "~/utils/preview-translation";
import type { HotspotsItemData } from "./item";

interface ProductPopupProps
  extends Omit<HotspotsItemData, "icon" | "iconSize" | "product"> {
  product: ProductQuery["product"];
  floating?: boolean;
}

const PRODUCT_PLACEHOLDER: Partial<ProductQuery["product"]> = {
  id: "gid://shopify/Product/123",
  title: "Example Product Title",
  handle: "#",
  media: {
    nodes: [
      {
        id: "1",
        __typename: "MediaImage",
        mediaContentType: "IMAGE",
        image: {
          id: "1",
          url: IMAGES_PLACEHOLDERS.product_4,
          width: 500,
          height: 500,
        },
      },
    ],
  },
  // @ts-expect-error
  variants: {
    nodes: [
      {
        id: "1",
        availableForSale: true,
        quantityAvailable: 0,
        selectedOptions: [],
        price: {
          amount: "99.0",
          currencyCode: "USD",
        },
        compareAtPrice: {
          amount: "129.0",
          currencyCode: "USD",
        },
        title: "Default Title",
        unitPrice: null,
        product: {
          title: "Example Product",
          handle: "#",
        },
      },
    ],
  },
};

function ProductColorOptions({
  product,
  selectedVariant,
  setSelectedVariant,
}: {
  product: ProductQuery["product"];
  selectedVariant: ProductVariantFragment | null;
  setSelectedVariant: (variant: ProductVariantFragment) => void;
}) {
  const colorOption = product.options?.find(({ name }) =>
    OPTIONS_AS_SWATCH.includes(name),
  );

  if (!colorOption?.optionValues?.length) {
    return null;
  }

  const selectedValue = selectedVariant?.selectedOptions?.find(
    ({ name }) => name === colorOption.name,
  )?.value;

  return (
    <div className="flex gap-2">
      {colorOption.optionValues
        .slice(0, 4)
        .map(({ name, swatch, firstSelectableVariant }) => {
          const swatchColor = swatch?.color || name;
          const isSelected = selectedValue === name;

          return (
            <Tooltip key={name}>
              <TooltipTrigger>
                <button
                  type="button"
                  className={clsx(
                    "flex size-4 items-center justify-center rounded-[4px] border p-px transition-colors",
                    isSelected
                      ? "border-[#A79D95]"
                      : "border-[#9D9D9D] hover:border-[#A79D95]",
                  )}
                  onClick={() => {
                    if (firstSelectableVariant) {
                      setSelectedVariant(firstSelectableVariant);
                    }
                  }}
                >
                  {swatch?.image?.previewImage ? (
                    <Image
                      data={swatch.image.previewImage}
                      className="h-full w-full rounded-[1px] object-cover object-center"
                      width={12}
                      height={12}
                      sizes="12px"
                    />
                  ) : (
                    <span
                      className={clsx(
                        "inline-block h-full w-full rounded-[1px] text-[0px]",
                        (!isValidColor(swatchColor) ||
                          isLightColor(swatchColor)) &&
                          "border border-line-subtle",
                        !isValidColor(swatchColor) && "bg-gray-200",
                      )}
                      style={
                        isValidColor(swatchColor)
                          ? { backgroundColor: swatchColor }
                          : undefined
                      }
                    >
                      {name}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{name}</TooltipContent>
            </Tooltip>
          );
        })}
    </div>
  );
}

export function ProductPopup({
  // @ts-expect-error
  product = PRODUCT_PLACEHOLDER,
  offsetX,
  offsetY,
  showPrice,
  showViewDetailsLink,
  viewDetailsLinkText,
  floating = false,
}: ProductPopupProps) {
  const { t } = useTranslation();

  if (product === PRODUCT_PLACEHOLDER) {
    product = translatePreview(t, product);
  }
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(
      product?.selectedOrFirstAvailableVariant ?? null,
    );

  if (!product) {
    return null;
  }

  const featuredMedia = product.media.nodes.find(
    (node) => node.__typename === "MediaImage",
  ) as MediaImage;
  const featuredImage = featuredMedia?.image;
  const price = product.priceRange?.minVariantPrice;

  return (
    <div
      className={
        floating
          ? "w-[240px] max-w-[calc(100vw-24px)]"
          : clsx(
              "absolute z-10 w-[240px] transition-all duration-300",
              "invisible opacity-0",
              "max-w-[calc(100vw-24px)]",
              "translate-x-[calc(var(--translate-x-ratio)*var(--spot-size))]",
              "translate-y-[calc(var(--translate-y-ratio)*-16px)]",
              "group-hover:visible group-hover:opacity-100",
              "group-hover:translate-x-[calc(var(--translate-x-ratio)*var(--spot-size))]",
              "group-hover:translate-y-0",
            )
      }
      style={
        floating
          ? undefined
          : ({
              "--translate-x-ratio": offsetX > 50 ? 1 : -1,
              "--translate-y-ratio": offsetY > 50 ? 1 : -1,
              top: offsetY > 50 ? "auto" : "100%",
              bottom: offsetY > 50 ? "100%" : "auto",
              left: offsetX > 50 ? "auto" : "100%",
              right: offsetX > 50 ? "100%" : "auto",
            } as CSSProperties)
      }
    >
      <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-3 shadow-[0_0_8px_rgba(115,99,81,0.2)]">
        {/* Thumbnail */}
        {featuredImage && (
          <div className="aspect-[216/248] w-full overflow-hidden rounded-xl bg-gray-100">
            <Image
              data={featuredImage}
              alt={product.title}
              sizes="216px"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Info Section */}
        <div className="flex flex-col gap-2">
          <ProductColorOptions
            product={product}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
          />
          <ProductCardRating
            ratingValue={product.reviewRating?.value}
            ratingCountValue={product.reviewRatingCount?.value}
          />
          <h3 className="line-clamp-1 font-dm-sans font-normal text-[#343231] text-[14px] not-italic uppercase leading-[14px] tracking-[0.28px]">
            {product.title}
          </h3>
          {showPrice && price && (
            <div className="font-dm-sans font-normal text-[#343231] text-[14px] not-italic leading-[14px] tracking-[0.28px]">
              <SpacedMoney data={price} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {showViewDetailsLink && (
            <Link
              to={`/products/${product.handle}`}
              variant="secondary"
              className="flex flex-1 items-center justify-center gap-2 px-6 py-5 font-semibold text-[#343231] text-sm uppercase leading-none tracking-[0.02em]"
            >
              {viewDetailsLinkText}
            </Link>
          )}
          <AddToCartButton
            width="auto"
            disabled={!selectedVariant?.availableForSale}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
            className="!h-[54px] !w-[54px] !p-0 flex shrink-0 items-center justify-center bg-(--btn-primary-bg) text-(--btn-primary-text) hover:bg-(--btn-primary-bg-hover)"
          >
            <ShoppingBagIcon size={20} />
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}
