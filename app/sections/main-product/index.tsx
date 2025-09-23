import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  ShopPayButton,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import type {
  MoneyV2,
  ProductVariantComponent,
} from "@shopify/hydrogen/storefront-api-types";
import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useState } from "react";
import { useLoaderData } from "react-router";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductBadges } from "~/components/product/badges";
import { BundledVariants } from "~/components/product/bundled-variants";
import {
  ProductMedia,
  type ProductMediaProps,
} from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import {
  CompareAtPrice,
  VariantPrices,
} from "~/components/product/variant-prices";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { isCombinedListing } from "~/utils/combined-listings";
import { isDiscounted } from "~/utils/product";
import { ProductDetails } from "./product-details";
import { ProductVariants } from "./variants";

interface ProductInformationData
  extends Omit<ProductMediaProps, "selectedVariant" | "media"> {
  addToCartText: string;
  addBundleToCartText: string;
  soldOutText: string;
  showVendor: boolean;
  showSalePrice: boolean;
  showShortDescription: boolean;
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
  showBadgesOnProductMedia?: boolean;
  arrowsZoomColor?: "primary" | "secondary" | "outline";
  arrowsZoomShape?: "rounded-sm" | "circle" | "square";
}

const ProductInformation = forwardRef<
  HTMLDivElement,
  ProductInformationData & SectionProps
>((props, ref) => {
  const { product, storeDomain } = useLoaderData<typeof productRouteLoader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {
    addToCartText,
    addBundleToCartText,
    soldOutText,
    showVendor,
    showSalePrice,
    showShortDescription,
    showShippingPolicy,
    showRefundPolicy,
    mediaLayout,
    gridSize,
    imageAspectRatio,
    showThumbnails,
    children,
    enableZoom,
    showDots,
    navigationStyle,
    arrowsColor,
    arrowsShape,
    arrowsZoomColor,
    arrowsZoomShape,
    zoomColor,
    zoomShape,
    showBadgesOnProductMedia,
    ...rest
  } = props;
  const [quantity, setQuantity] = useState<number>(1);

  const isBundle = Boolean(product?.isBundle?.requiresComponents);
  const bundledVariants = isBundle ? product?.isBundle?.components.nodes : null;
  const combinedListing = isCombinedListing(product);

  if (product) {
    const { title, handle, vendor, summary, priceRange, publishedAt, badges } =
      product;
    let atcButtonText = "Add to cart";
    if (selectedVariant.availableForSale) {
      atcButtonText = isBundle ? addBundleToCartText : addToCartText;
    } else {
      atcButtonText = soldOutText;
    }

    return (
      <Section ref={ref} {...rest} overflow="unset">
        <div
          className={clsx([
            "space-y-5 lg:grid lg:space-y-0",
            "lg:gap-[clamp(30px,5%,60px)]",
            "lg:grid-cols-[1fr_clamp(360px,25%,480px)]",
          ])}
        >
          <ProductMedia
            key={handle}
            mediaLayout={mediaLayout}
            gridSize={gridSize}
            imageAspectRatio={imageAspectRatio}
            media={
              combinedListing && product?.featuredImage
                ? [
                    {
                      __typename: "MediaImage",
                      id: product.featuredImage.id,
                      mediaContentType: "IMAGE",
                      alt: product.featuredImage.altText,
                      previewImage: product.featuredImage,
                      image: product.featuredImage,
                    },
                    ...(product?.media?.nodes || []),
                  ]
                : product?.media?.nodes || []
            }
            selectedVariant={selectedVariant}
            showThumbnails={showThumbnails}
            enableZoom={enableZoom}
            showDots={showDots}
            navigationStyle={navigationStyle}
            arrowsColor={arrowsColor}
            arrowsShape={arrowsShape}
            zoomColor={zoomColor}
            zoomShape={zoomShape}
            arrowsZoomColor={arrowsZoomColor}
            arrowsZoomShape={arrowsZoomShape}
            showBadges={showBadgesOnProductMedia}
            badges={
              selectedVariant && (
                <ProductBadges
                  product={product}
                  selectedVariant={selectedVariant}
                />
              )
            }
          />
          <div>
            <div
              className="sticky flex flex-col justify-start space-y-5"
              style={{ top: "calc(var(--height-nav) + 20px)" }}
            >
              <div className="flex flex-col gap-2">
                {showVendor && vendor && (
                  <span className="text-body-subtle">{vendor}</span>
                )}
                <h3 className="font-normal uppercase tracking-tight">
                  {title}
                </h3>
              </div>

              <div className="space-y-5 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
                {combinedListing ? (
                  <div className="flex justify-between">
                    <span className="font-normal uppercase">Price Range</span>
                    <div className="flex gap-2 text-2xl/none">
                      <span className="flex gap-1">
                        From
                        <VariantPrices
                          variant={{
                            price: product.priceRange.minVariantPrice,
                          }}
                          showCompareAtPrice={false}
                        />
                      </span>
                      <span className="flex gap-1">
                        To
                        <VariantPrices
                          variant={{
                            price: product.priceRange.maxVariantPrice,
                          }}
                          showCompareAtPrice={false}
                        />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="font-normal uppercase">Price</span>
                    <div className="flex items-center gap-2">
                      <Money
                        withoutTrailingZeros
                        data={selectedVariant.price}
                        as="span"
                        className=""
                      />
                      {isDiscounted(
                        selectedVariant.price as MoneyV2,
                        selectedVariant.compareAtPrice as MoneyV2,
                      ) &&
                        showSalePrice && (
                          <CompareAtPrice
                            data={selectedVariant.compareAtPrice as MoneyV2}
                            className=""
                          />
                        )}
                    </div>
                  </div>
                )}

                {children}

                {isBundle && (
                  <div className="space-y-3">
                    <h4 className="text-2xl">Bundled Products</h4>
                    <BundledVariants
                      variants={bundledVariants as ProductVariantComponent[]}
                    />
                  </div>
                )}

                <ProductVariants
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                  combinedListing={combinedListing}
                />

                {!combinedListing && (
                  <Quantity value={quantity} onChange={setQuantity} />
                )}
              </div>

              {!combinedListing && (
                <div
                  className="sp-button space-y-2 py-3"
                  style={
                    {
                      "--shop-pay-button-height": "54px",
                    } as React.CSSProperties
                  }
                >
                  <AddToCartButton
                    disabled={!selectedVariant?.availableForSale}
                    lines={[
                      {
                        merchandiseId: selectedVariant?.id,
                        quantity,
                        selectedVariant,
                      },
                    ]}
                    data-test="add-to-cart"
                    className="h-[54px] w-full uppercase"
                  >
                    {atcButtonText}
                  </AddToCartButton>
                  {selectedVariant?.availableForSale && (
                    <ShopPayButton
                      width="100%"
                      variantIdsAndQuantities={[
                        {
                          id: selectedVariant?.id,
                          quantity,
                        },
                      ]}
                      storeDomain={storeDomain}
                    />
                  )}
                </div>
              )}

              <ProductDetails
                showShippingPolicy={showShippingPolicy}
                showRefundPolicy={showRefundPolicy}
                showShortDescription={showShortDescription}
                product={product}
              />
            </div>
          </div>
        </div>
      </Section>
    );
  }
  return (
    <div ref={ref} {...rest}>
      No product data...
    </div>
  );
});

export default ProductInformation;

export const schema = createSchema({
  type: "main-product",
  title: "Main product",
  childTypes: ["judgeme"],
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    { group: "Layout", inputs: layoutInputs },
    {
      group: "Product Media",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Aspect ratio",
          defaultValue: "adapt",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
            ],
          },
        },
        {
          type: "toggle-group",
          name: "mediaLayout",
          label: "Layout",
          configs: {
            options: [
              {
                label: "Grid",
                value: "grid",
                icon: "grid-2x2",
              },
              {
                label: "Slider",
                value: "slider",
                icon: "slideshow-outline",
              },
            ],
          },
          defaultValue: "grid",
        },
        {
          type: "select",
          name: "gridSize",
          label: "Grid size",
          defaultValue: "2x2",
          configs: {
            options: [
              { label: "1x1", value: "1x1" },
              { label: "2x2", value: "2x2" },
              { label: "Mix", value: "mix" },
            ],
          },
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "grid",
        },
        {
          label: "Show thumbnails",
          name: "showThumbnails",
          type: "switch",
          defaultValue: true,
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider",
        },
        {
          label: "Show dots",
          name: "showDots",
          type: "switch",
          defaultValue: true,
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider",
        },
        {
          type: "heading",
          label: "Navigation",
        },
        {
          label: "Navigation style",
          name: "navigationStyle",
          type: "select",
          defaultValue: "corner",
          configs: {
            options: [
              { value: "corner", label: "Corner" },
              { value: "sides", label: "Sides" },
            ],
          },
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider",
        },
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ],
          },
          defaultValue: "primary",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider",
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "arrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider",
        },
        {
          type: "heading",
          label: "Zooms",
        },
        {
          label: "Enable zoom",
          name: "enableZoom",
          type: "switch",
          defaultValue: true,
        },
        {
          type: "select",
          label: "Zoom arrows color",
          name: "arrowsZoomColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ],
          },
          defaultValue: "primary",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider" && data.enableZoom === true,
        },
        {
          type: "toggle-group",
          label: "Zoom arrows shape",
          name: "arrowsZoomShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider" && data.enableZoom === true,
        },
        {
          type: "select",
          label: "Zoom button color",
          name: "zoomColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider" && data.enableZoom === true,
        },
        {
          type: "toggle-group",
          label: "Zoom button shape",
          name: "zoomShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "slider" && data.enableZoom === true,
        },
        {
          type: "switch",
          label: "Show badges on product media",
          name: "showBadgesOnProductMedia",
          defaultValue: true,
          helpText:
            "Display sale, new, and best seller badges on product images",
        },
      ],
    },
    {
      group: "Product information",
      inputs: [
        {
          type: "text",
          label: "Add to cart text",
          name: "addToCartText",
          defaultValue: "Add to cart",
          placeholder: "Add to cart",
        },
        {
          type: "text",
          label: "Bundle add to cart text",
          name: "addBundleToCartText",
          defaultValue: "Add bundle to cart",
          placeholder: "Add bundle to cart",
        },
        {
          type: "text",
          label: "Sold out text",
          name: "soldOutText",
          defaultValue: "Sold out",
          placeholder: "Sold out",
        },
        {
          type: "switch",
          label: "Show vendor",
          name: "showVendor",
          defaultValue: false,
        },
        {
          type: "switch",
          label: "Show sale price",
          name: "showSalePrice",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show short description",
          name: "showShortDescription",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show shipping policy",
          name: "showShippingPolicy",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show refund policy",
          name: "showRefundPolicy",
          defaultValue: true,
        },
      ],
    },
  ],
  presets: {
    mediaLayout: "grid",
    gridSize: "2x2",
  },
});
