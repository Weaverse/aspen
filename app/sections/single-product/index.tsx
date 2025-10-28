import { getProductOptions, Money, ShopPayButton } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/customer-account-api-types";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useState } from "react";
import type {
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductBadges, SoldOutBadge } from "~/components/product/badges";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { CompareAtPrice } from "~/components/product/variant-prices";
import { layoutInputs, Section } from "~/components/section";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { useAnimation } from "~/hooks/use-animation";
import { isDiscounted } from "~/utils/product";
import { ProductDetails } from "../main-product/product-details";
import { ProductVariants } from "../main-product/variants";

interface SingleProductData {
  productsCount: number;
  product: WeaverseProduct;
  // Product Media settings
  mediaLayout: "grid" | "slider";
  gridSize: "1x1" | "2x2" | "mix";
  imageAspectRatio: "adapt" | "1/1" | "3/4" | "4/3";
  showThumbnails: boolean;
  showDots: boolean;
  navigationStyle: "corner" | "sides";
  arrowsColor: "primary" | "secondary";
  arrowsShape: "rounded-sm" | "circle" | "square";
  enableZoom: boolean;
  arrowsZoomColor: "primary" | "secondary" | "outline";
  arrowsZoomShape: "rounded-sm" | "circle" | "square";
  zoomColor: "primary" | "secondary";
  zoomShape: "rounded-sm" | "circle" | "square";
  showBadgesOnProductMedia: boolean;
  // Product information settings
  addToCartText: string;
  soldOutText: string;
  showVendor: boolean;
  showSalePrice: boolean;
  showShortDescription: boolean;
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
}

type SingleProductProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  SingleProductData;

const SingleProduct = forwardRef<HTMLElement, SingleProductProps>(
  (props, ref) => {
    const {
      loaderData,
      children,
      product: _product,
      // Product Media props
      mediaLayout,
      gridSize,
      imageAspectRatio,
      showThumbnails,
      showDots,
      navigationStyle,
      arrowsColor,
      arrowsShape,
      enableZoom,
      arrowsZoomColor,
      arrowsZoomShape,
      zoomColor,
      zoomShape,
      showBadgesOnProductMedia,
      // Product information props
      addToCartText,
      soldOutText,
      showVendor,
      showSalePrice = true,
      showShortDescription,
      showShippingPolicy = true,
      showRefundPolicy = true,
      ...rest
    } = props;
    const { storeDomain, product } = loaderData || {};
    const [quantity, setQuantity] = useState<number>(1);
    const currentVariant = product?.selectedOrFirstAvailableVariant;
    const [scope] = useAnimation(ref);

    // Get price range for when no variant is selected
    const priceRange = product?.priceRange;

    if (!product) {
      return (
        <Section ref={ref} {...rest}>
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <Image
                data={{
                  url: IMAGES_PLACEHOLDERS.product_2,
                  width: 1660,
                  height: 1660,
                }}
                loading="lazy"
                width={1660}
                aspectRatio="1/1"
                sizes="auto"
              />
              <div className="flex flex-col items-start justify-start gap-4">
                <SoldOutBadge />
                <h3 data-motion="fade-up" className="tracking-tight">
                  EXAMPLE PRODUCT TITLE
                </h3>
                <Money
                  withoutTrailingZeros
                  data={{ amount: "19.99", currencyCode: "USD" }}
                  as="span"
                  className="text-lg"
                />
                <p className="text-body-subtle">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <Button
                  type="button"
                  className="w-full cursor-not-allowed"
                  disabled
                >
                  SOLD OUT
                </Button>
                <Link
                  to="#"
                  prefetch="intent"
                  variant="underline"
                  className="w-fit cursor-not-allowed"
                  onClick={(e) => e.preventDefault()}
                >
                  View full details →
                </Link>
              </div>
            </div>
          </div>
        </Section>
      );
    }

    // Get the product options array
    const productOptions = getProductOptions({
      ...product,
      selectedOrFirstAvailableVariant: currentVariant,
    });
    let shouldRenderVariants = true;
    // Check if this is a default variant only product
    if (productOptions.length === 1) {
      const option = productOptions[0];
      if (option.name === "Title" && option.optionValues.length === 1) {
        const optionValue = option.optionValues[0];
        if (optionValue.name === "Default Title") {
          shouldRenderVariants = false;
        }
      }
    }

    const atcText = currentVariant?.availableForSale
      ? addToCartText || "Add to Cart"
      : currentVariant?.quantityAvailable === -1
        ? "Unavailable"
        : soldOutText || "Sold Out";

    return (
      <Section ref={ref} {...rest} overflow="unset">
        <div ref={scope}>
          <div
            className={clsx([
              "space-y-5 lg:grid lg:space-y-0",
              "lg:gap-[clamp(30px,5%,60px)]",
              "lg:grid-cols-[1fr_clamp(360px,25%,480px)]",
            ])}
          >
            <ProductMedia
              mediaLayout={mediaLayout || "slider"}
              gridSize={gridSize || "2x2"}
              imageAspectRatio={imageAspectRatio || "1/1"}
              media={product?.media.nodes}
              selectedVariant={currentVariant}
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
                currentVariant && (
                  <ProductBadges
                    product={product}
                    selectedVariant={currentVariant}
                  />
                )
              }
            />
            <div>
              <div
                className="sticky flex flex-col justify-start space-y-5"
                style={{ top: "calc(var(--height-nav) + 20px)" }}
                data-motion="slide-in"
              >
                <div className="flex flex-col gap-2">
                  {showVendor && product.vendor && (
                    <span className="text-body-subtle">{product.vendor}</span>
                  )}
                  <h3 className="font-normal uppercase tracking-tight">
                    {product?.title}
                  </h3>
                </div>

                <div className="space-y-5 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
                  {currentVariant ? (
                    <div className="flex justify-between">
                      <span className="font-normal uppercase">Price</span>
                      <div className="flex items-center gap-2">
                        <Money
                          withoutTrailingZeros
                          data={currentVariant.price}
                          as="span"
                          className=""
                        />
                        {isDiscounted(
                          currentVariant.price as MoneyV2,
                          currentVariant.compareAtPrice as MoneyV2,
                        ) &&
                          showSalePrice && (
                            <CompareAtPrice
                              data={currentVariant.compareAtPrice as MoneyV2}
                              className=""
                            />
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="font-normal uppercase">Price</span>
                      {priceRange && (
                        <Money
                          withoutTrailingZeros
                          data={priceRange.minVariantPrice}
                          as="div"
                          className=""
                        />
                      )}
                    </div>
                  )}

                  {children}

                  {shouldRenderVariants ? (
                    <ProductVariants
                      productOptions={productOptions}
                      selectedVariant={currentVariant}
                    />
                  ) : null}

                  <Quantity value={quantity} onChange={setQuantity} />
                </div>

                <div
                  className="sp-button space-y-2 py-3"
                  style={
                    {
                      "--shop-pay-button-height": "54px",
                    } as React.CSSProperties
                  }
                >
                  <AddToCartButton
                    disabled={!currentVariant?.availableForSale}
                    lines={[
                      {
                        merchandiseId: currentVariant?.id,
                        quantity,
                        selectedVariant: currentVariant,
                      },
                    ]}
                    data-test="add-to-cart"
                    className="h-[54px] w-full uppercase"
                  >
                    {atcText}
                  </AddToCartButton>
                  {currentVariant?.availableForSale && (
                    <ShopPayButton
                      width="100%"
                      variantIdsAndQuantities={[
                        {
                          id: currentVariant?.id,
                          quantity,
                        },
                      ]}
                      storeDomain={storeDomain}
                    />
                  )}
                </div>

                <ProductDetails
                  showShippingPolicy={showShippingPolicy}
                  showRefundPolicy={showRefundPolicy}
                  showShortDescription={showShortDescription}
                  product={product}
                />

                <Link
                  to={`/products/${product.handle}`}
                  prefetch="intent"
                  variant="underline"
                  className="w-fit"
                >
                  View full details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    );
  },
);

export const loader = async (args: ComponentLoaderArgs<SingleProductData>) => {
  const { weaverse, data } = args;
  const { storefront } = weaverse;
  if (!data.product) {
    return null;
  }
  const productHandle = data.product.handle;
  const { product, shop } = await storefront.query<ProductQuery>(
    PRODUCT_QUERY,
    {
      variables: {
        handle: productHandle,
        selectedOptions: [],
        language: storefront.i18n.language,
        country: storefront.i18n.country,
      },
    },
  );

  return {
    product,
    shop,
    storeDomain: shop.primaryDomain.url,
  };
};

export const schema = createSchema({
  type: "single-product",
  title: "Single product",
  childTypes: ["judgeme"],
  settings: [
    { group: "Layout", inputs: layoutInputs },
    {
      group: "Product",
      inputs: [
        {
          label: "Select product",
          type: "product",
          name: "product",
          shouldRevalidate: true,
        },
      ],
    },
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
          defaultValue: "slider",
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
          condition: (data: SingleProductData) => data.mediaLayout === "grid",
        },
        {
          label: "Show thumbnails",
          name: "showThumbnails",
          type: "switch",
          defaultValue: true,
          condition: (data: SingleProductData) => data.mediaLayout === "slider",
        },
        {
          label: "Show dots",
          name: "showDots",
          type: "switch",
          defaultValue: true,
          condition: (data: SingleProductData) => data.mediaLayout === "slider",
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
          condition: (data: SingleProductData) => data.mediaLayout === "slider",
        },
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
          condition: (data: SingleProductData) => data.mediaLayout === "slider",
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
          condition: (data: SingleProductData) => data.mediaLayout === "slider",
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
          condition: (data: SingleProductData) =>
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
          condition: (data: SingleProductData) =>
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
          condition: (data: SingleProductData) =>
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
          condition: (data: SingleProductData) =>
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
    mediaLayout: "slider",
    gridSize: "2x2",
  },
});

export default SingleProduct;
