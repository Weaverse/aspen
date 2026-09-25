import { PackageIcon } from "@phosphor-icons/react";
import { getProductOptions, Money, ShopPayButton } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useTranslation,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useEffect, useState } from "react";
import type { ProductQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductBadges, SoldOutBadge } from "~/components/product/badges";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { SpacedMoney } from "~/components/product/variant-prices";
import { layoutInputs, Section } from "~/components/section";
import { SellingPlanSelector } from "~/components/subscriptions/selling-plan-selector";
import { ProductCardWishlistButton } from "~/components/wishlist/product-card-wishlist-button";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { useAnimation } from "~/hooks/use-animation";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { isDiscounted } from "~/utils/product";
import { ProductVariants } from "../main-product/variants";

interface SingleProductData {
  productsCount: number;
  product: WeaverseProduct;
  heading: string;
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
  estimatedDeliveryText: string;
}

type SingleProductProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  SingleProductData;

const SingleProduct = forwardRef<HTMLElement, SingleProductProps>(
  (props, ref) => {
    const translateText = useTranslatedText();

    const { t } = useTranslation();
    const {
      loaderData,
      children,
      product: _product,
      heading: rawI18nHeading,
      // Product Media props
      mediaLayout,
      gridSize,
      imageAspectRatio: _imageAspectRatio,
      showThumbnails: _showThumbnails,
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
      addToCartText: rawI18nAddToCartText,
      soldOutText: rawI18nSoldOutText,
      showVendor,
      showSalePrice = true,
      estimatedDeliveryText: rawI18nEstimatedDeliveryText,
      ...rest
    } = props;
    const estimatedDeliveryText = translateText(
      rawI18nEstimatedDeliveryText,
      "themeContent.sectionsSingleProductIndex.estimatedDeliveryText",
    );
    const soldOutText = translateText(
      rawI18nSoldOutText,
      "themeContent.sectionsSingleProductIndex.soldOutText",
    );
    const addToCartText = translateText(
      rawI18nAddToCartText,
      "themeContent.sectionsSingleProductIndex.addToCartText",
    );
    const heading = translateText(
      rawI18nHeading,
      "themeContent.sectionsSingleProductIndex.heading",
    );
    const { storeDomain, product } = loaderData || {};
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedVariant, setSelectedVariant] = useState(
      product?.selectedOrFirstAvailableVariant,
    );
    const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<
      string | null
    >(null);
    const currentVariant =
      selectedVariant?.product?.handle === product?.handle
        ? selectedVariant
        : product?.selectedOrFirstAvailableVariant;
    useEffect(() => {
      setSelectedVariant(product?.selectedOrFirstAvailableVariant);
      setSelectedSellingPlanId(null);
      setQuantity(1);
    }, [product?.selectedOrFirstAvailableVariant]);
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
                  {t("product.exampleTitle")}
                </h3>
                <Money
                  withoutTrailingZeros
                  data={{ amount: "19.99", currencyCode: "USD" }}
                  as="span"
                  className="text-lg"
                />
                <p className="text-body-subtle">
                  {t("product.exampleDescription")}
                </p>
                <Button
                  type="button"
                  className="w-full cursor-not-allowed"
                  disabled
                >
                  {t("product.soldOut")}
                </Button>
                <Link
                  to="#"
                  prefetch="intent"
                  variant="underline"
                  className="w-fit cursor-not-allowed"
                  onClick={(e) => e.preventDefault()}
                >
                  {t("product.viewFullDetails")} →
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
      ? addToCartText || t("product.addToCart")
      : currentVariant?.quantityAvailable === -1
        ? t("product.unavailable")
        : soldOutText || t("product.soldOut");

    return (
      <Section ref={ref} {...rest} overflow="unset">
        <div ref={scope} className="flex flex-col gap-10 md:gap-16">
          {heading && (
            <h2 className="max-w-[260px] font-heading font-normal text-[37px] md:max-w-none md:text-[44px] uppercase leading-[1.1] tracking-[-0.03em]">
              {heading}
            </h2>
          )}
          <div
            className={clsx([
              "space-y-5 lg:grid lg:space-y-0",
              "lg:gap-10",
              "lg:max-w-[1360px] lg:grid-cols-[minmax(0,778fr)_minmax(0,542fr)]",
            ])}
          >
            <div className="featured-product-media relative mx-auto flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-[var(--Radius-border-radius-md,12px)] [&>div]:h-full [&>div]:w-full [&_.swiper]:h-full [&_.swiper]:w-full [&_.swiper-slide]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center [&_img]:rounded-[var(--Radius-border-radius-md,12px)] lg:mx-0 lg:max-w-[778px]">
              <ProductMedia
                mediaLayout={mediaLayout || "slider"}
                navigationVariant="quick-shop"
                gridSize={gridSize || "2x2"}
                imageAspectRatio="1/1"
                media={product?.media.nodes}
                selectedVariant={currentVariant}
                showThumbnails={false}
                enableZoom={enableZoom}
                showDots={showDots}
                navigationStyle={navigationStyle ?? "sides"}
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
              <ProductCardWishlistButton
                productId={product.id}
                productTitle={product.title}
                showOnMobile
              />
            </div>
            <div className="min-w-0">
              <div
                className="lg:sticky flex flex-col justify-start gap-8"
                style={{ top: "calc(var(--height-nav) + 20px)" }}
                data-motion="slide-in"
              >
                <div className="flex flex-col gap-4">
                  {showVendor && product.vendor && (
                    <span className="text-body-subtle">{product.vendor}</span>
                  )}
                  <h3 className="font-heading font-normal text-[37px] uppercase leading-[1.1] tracking-[-0.03em] lg:text-[44px]">
                    {product?.title}
                  </h3>

                  {currentVariant ? (
                    <div className="flex items-center gap-3 font-heading font-normal text-2xl">
                      {isDiscounted(
                        currentVariant.price as MoneyV2,
                        currentVariant.compareAtPrice as MoneyV2,
                      ) &&
                        showSalePrice && (
                          <span className="font-heading font-normal text-[24px] text-[#999] not-italic leading-[normal] line-through">
                            <SpacedMoney
                              data={currentVariant.compareAtPrice as MoneyV2}
                            />
                          </span>
                        )}
                      <SpacedMoney data={currentVariant.price} />
                    </div>
                  ) : (
                    priceRange && (
                      <Money
                        withoutTrailingZeros
                        data={priceRange.minVariantPrice}
                        as="div"
                        className="font-heading font-normal text-2xl"
                      />
                    )
                  )}

                  <ProductCardRating
                    ratingValue={product.reviewRating?.value}
                    ratingCountValue={product.reviewRatingCount?.value}
                  />
                </div>

                <div className="flex flex-col gap-7">
                  {children}

                  {shouldRenderVariants ? (
                    <ProductVariants
                      productOptions={productOptions}
                      selectedVariant={currentVariant}
                      onVariantChange={(variant) => {
                        setSelectedVariant(variant);
                        setSelectedSellingPlanId(null);
                      }}
                    />
                  ) : null}
                  {currentVariant && (
                    <SellingPlanSelector
                      variant={currentVariant}
                      product={product}
                      selectedSellingPlanId={selectedSellingPlanId}
                      onSellingPlanChange={setSelectedSellingPlanId}
                    />
                  )}
                </div>

                <div
                  className="sp-button space-y-3"
                  style={
                    {
                      "--shop-pay-button-height": "56px",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex gap-3">
                    <Quantity
                      value={quantity}
                      onChange={setQuantity}
                      variant="stepper"
                      className="w-[34%] min-w-0 shrink-0 bg-[#DFDFDF]"
                    />
                    <AddToCartButton
                      width="auto"
                      containerClassName="min-w-0 flex-1"
                      disabled={!currentVariant?.availableForSale}
                      lines={[
                        {
                          merchandiseId: currentVariant?.id,
                          quantity,
                          selectedVariant: currentVariant,
                          sellingPlanId: selectedSellingPlanId,
                        },
                      ]}
                      data-test="add-to-cart"
                      className="h-[54px] w-full rounded-lg uppercase"
                    >
                      {atcText}
                    </AddToCartButton>
                  </div>
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

                {estimatedDeliveryText && (
                  <div className="flex w-fit max-w-full items-center gap-2.5 rounded-lg bg-(--color-background) text-(--color-text-subtle) text-sm">
                    <PackageIcon
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 whitespace-normal">
                      {estimatedDeliveryText}
                    </span>
                  </div>
                )}

                <Link
                  to={`/products/${product.handle}`}
                  prefetch="intent"
                  className="w-fit justify-start font-normal text-(--color-text-subtle) text-sm underline underline-offset-2"
                >
                  {t("product.viewFullDetails")}
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
  title: "Featured Product",
  settings: [
    { group: "Layout", inputs: layoutInputs },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "FEATURED PRODUCT",
          placeholder: "FEATURED PRODUCT",
          helpText: "Leave blank to hide the heading.",
        },
      ],
    },
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
          type: "toggle-group",
          name: "mediaLayout",
          label: "Layout",
          configs: {
            options: [
              {
                label: "Scenario 1",
                value: "grid",
                icon: "grid-2x2",
              },
              {
                label: "Scenario 2",
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
          label: "Scenario 1 grid size",
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
          defaultValue: "sides",
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
          defaultValue: "Add to bag",
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
          type: "text",
          label: "Estimated delivery text",
          name: "estimatedDeliveryText",
          defaultValue: "Estimated delivery within 3-5 business days",
          placeholder: "Estimated delivery within 3-5 business days",
          helpText: "Leave blank to hide the delivery estimate row.",
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
