import { ShoppingBagIcon } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import type { MediaImage } from "@shopify/hydrogen/storefront-api-types";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
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
import { OPTIONS_AS_SWATCH } from "~/components/product/product-option-values";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { isLightColor } from "~/utils/misc";
import type { TestimonialHotspotsItemData } from "./item";

interface ProductPopupProps
  extends Omit<TestimonialHotspotsItemData, "icon" | "iconSize" | "product"> {
  product: ProductQuery["product"];
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
    <div className="flex justify-end">
      <div className="flex gap-1.5">
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
                      "h-2.5 w-2.5 overflow-hidden outline-1 outline-solid outline-offset-1 transition-(outline-color)",
                      isSelected
                        ? "outline-gray-800"
                        : "outline-transparent hover:outline-gray-400",
                      // Apply background directly to button when it's a solid color
                      !swatch?.image?.previewImage &&
                        isLightColor(swatchColor) &&
                        "border border-gray-300",
                    )}
                    style={
                      swatch?.image?.previewImage
                        ? undefined
                        : { backgroundColor: swatchColor }
                    }
                    onClick={() => {
                      if (firstSelectableVariant) {
                        setSelectedVariant(firstSelectableVariant);
                      }
                    }}
                  >
                    {swatch?.image?.previewImage ? (
                      <Image
                        data={swatch.image.previewImage}
                        className="h-full w-full object-cover object-center"
                        width={10}
                        height={10}
                        sizes="10px"
                      />
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{name}</TooltipContent>
              </Tooltip>
            );
          })}
      </div>
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
}: ProductPopupProps) {
  if (!product) {
    return null;
  }

  // State for variant selection
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(
      product.selectedOrFirstAvailableVariant,
    );

  const featuredMedia = product.media.nodes.find(
    (node) => node.__typename === "MediaImage",
  ) as MediaImage;
  const featuredImage = featuredMedia?.image;
  const price = product.priceRange?.minVariantPrice;
  const compareAtPrice = product.priceRange?.maxVariantPrice;

  return (
    <div
      className={clsx(
        "absolute z-10 transition-all duration-300",
        "invisible opacity-0",
        "w-40 sm:w-48 md:w-52", // Responsive: 160px → 192px → 208px
        "max-w-[calc(100vw-24px)]", // Always leave 12px margin on each side
        "min-w-[160px]", // Minimum width to ensure content readability
        "translate-x-[calc(var(--translate-x-ratio)*var(--spot-size))]",
        "translate-y-[calc(var(--translate-y-ratio)*-16px)]",
        "group-hover:visible group-hover:opacity-100",
        "group-hover:translate-x-[calc(var(--translate-x-ratio)*var(--spot-size))]",
        "group-hover:translate-y-0",
      )}
      style={
        {
          "--translate-x-ratio": offsetX > 50 ? 1 : -1,
          "--translate-y-ratio": offsetY > 50 ? 1 : -1,
          top: offsetY > 50 ? "auto" : "100%",
          bottom: offsetY > 50 ? "100%" : "auto",
          left: offsetX > 50 ? "auto" : "100%",
          right: offsetX > 50 ? "100%" : "auto",
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-2 overflow-hidden bg-white p-2 shadow-[0_0_8px_rgba(115,99,81,0.2)] sm:gap-3 sm:p-2.5 md:p-3">
        {/* Thumbnail */}
        {featuredImage && (
          <div className="aspect-square w-full overflow-hidden bg-gray-100">
            <Image
              data={featuredImage}
              alt={product.title}
              sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Info Section */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Title */}
          <h3 className="line-clamp-1 font-semibold text-[#29231E] text-xs uppercase leading-tight tracking-[0.02em] sm:text-sm md:text-sm">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            {/* Price */}
            {showPrice && (
              <div className="flex items-center gap-1.5">
                {compareAtPrice && compareAtPrice.amount !== price?.amount && (
                  <Money
                    withoutTrailingZeros
                    data={compareAtPrice}
                    as="span"
                    className="text-gray-400 text-xs line-through sm:text-sm"
                  />
                )}
                {price && (
                  <Money
                    withoutTrailingZeros
                    data={price}
                    as="span"
                    className="font-normal text-[#29231E] text-xs tracking-[0.02em] sm:text-sm"
                  />
                )}
              </div>
            )}

            {/* Color Options */}
            <ProductColorOptions
              product={product}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 sm:gap-2">
          {showViewDetailsLink && (
            <Link
              to={`/products/${product.handle}`}
              variant="secondary"
              className="!p-0 flex w-full items-center justify-center uppercase"
            >
              {viewDetailsLinkText}
            </Link>
          )}
          <AddToCartButton
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
            className="flex h-12 items-center justify-center bg-[#908379] text-white transition-colors hover:bg-[#7a6f66]"
          >
            <ShoppingBagIcon size={16} />
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}
