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
import {
  createSchema,
  useTranslation,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { BackInStockForm } from "~/components/product/back-in-stock-form";
import { ProductBadges } from "~/components/product/badges";
import { BundledVariants } from "~/components/product/bundled-variants";
import { ProductRating } from "~/components/product/judgeme-review";
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
import { SellingPlanSelector } from "~/components/subscriptions/selling-plan-selector";
import { ProductWishlistButton } from "~/components/wishlist/product-wishlist-button";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import ReviewIndex from "~/sections/judgeme-reviews/review-index";
import { isCombinedListing } from "~/utils/combined-listings";
import { isDiscounted } from "~/utils/product";
import { ProductDetails } from "./product-details";
import { ProductStory } from "./product-story";
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
  showInventoryStatus: boolean;
  showWishlist: boolean;
  showBackInStockForm: boolean;
  lowInventoryThreshold: number;
  lowInventoryText: string;
  descriptionTitle: string;
  openDescriptionByDefault: boolean;
  showProductStory: boolean;
  storyHeroImage?: WeaverseImage | string;
  storyHeroImageMobile?: WeaverseImage | string;
  storyFirstImage?: WeaverseImage | string;
  storyFirstHeading: string;
  storySecondImage?: WeaverseImage | string;
  storySecondHeading: string;
  showProductRating: boolean;
  showProductReviews: boolean;
  reviewsTitle: string;
  reviewsDescription: string;
  showBadgesOnProductMedia?: boolean;
  arrowsZoomColor?: "primary" | "secondary" | "outline";
  arrowsZoomShape?: "rounded-sm" | "circle" | "square";
}

const ProductInformation = forwardRef<
  HTMLDivElement,
  ProductInformationData & SectionProps
>((props, ref) => {
  const { t } = useTranslation();
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
    showInventoryStatus = true,
    showWishlist = true,
    showBackInStockForm = true,
    lowInventoryThreshold = 10,
    lowInventoryText = "Hurry up! Only [quantity] items in stock.",
    descriptionTitle = "Dimensions",
    openDescriptionByDefault = true,
    showProductStory = true,
    storyHeroImage,
    storyHeroImageMobile,
    storyFirstImage,
    storyFirstHeading = "WHETHER A LAVISH VELVET SOFA, A BOLD-HUED BROCADE CHAISE.",
    storySecondImage,
    storySecondHeading = "TACTILE FABRIC TRENDS HAVE ALSO EXPANDED TO A BROADER UNIVERSE.",
    showProductRating = true,
    showProductReviews = true,
    reviewsTitle = "Customer Reviews",
    reviewsDescription = "Read what our customers are saying about this product.",
    mediaLayout,
    gridSize,
    imageAspectRatio,
    showThumbnails,
    // The star rating used to be a `judgeme` child; it is a section element now,
    // so any child saved on existing pages is intentionally dropped.
    children: _children,
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
    width,
    ...rest
  } = props;
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<
    string | null
  >(null);
  const availableQuantity = selectedVariant?.quantityAvailable;
  const quantityLimit =
    availableQuantity && availableQuantity > 0
      ? Math.max(1, Math.min(10, availableQuantity))
      : 10;

  useEffect(() => {
    setQuantity((current) => Math.min(current, quantityLimit));
  }, [quantityLimit]);

  const isBundle = Boolean(product?.isBundle?.requiresComponents);
  const bundledVariants = isBundle ? product?.isBundle?.components.nodes : null;
  const combinedListing = isCombinedListing(product);

  if (product) {
    const { title, handle, vendor } = product;
    const quantityAvailable = selectedVariant.quantityAvailable;
    const inventoryThreshold = Math.max(1, lowInventoryThreshold || 10);
    const showLowInventory = Boolean(
      showInventoryStatus &&
        selectedVariant.availableForSale &&
        quantityAvailable &&
        quantityAvailable > 0 &&
        quantityAvailable <= inventoryThreshold,
    );
    const maxQuantity = quantityLimit;
    let atcButtonText = "Add to cart";
    if (selectedVariant.availableForSale) {
      atcButtonText = isBundle ? addBundleToCartText : addToCartText;
    } else {
      atcButtonText = soldOutText;
    }

    return (
      <Section
        ref={ref}
        {...rest}
        width={width}
        verticalPadding="none"
        overflow="unset"
      >
        <div
          className={clsx(
            "space-y-0 lg:grid lg:gap-[clamp(30px,5%,60px)] lg:space-y-0",
            "lg:grid-cols-[minmax(0,1fr)_clamp(360px,32vw,480px)]",
          )}
        >
          <div
            className={clsx(
              width !== "full" &&
                "-mx-(--page-padding) w-[calc(100%+2*var(--page-padding))] lg:mx-0 lg:w-auto",
            )}
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
          </div>
          <div
            className={clsx(
              "pt-10 md:pt-12 lg:pt-0",
              width === "full" && "px-8 lg:pr-(--page-padding) lg:pl-0",
              width !== "full" && "px-2 lg:px-0",
            )}
          >
            <div
              className="flex flex-col justify-start gap-7 lg:sticky"
              style={{ top: "calc(var(--height-nav) + 24px)" }}
            >
              <div className="flex flex-col gap-2">
                {showVendor && vendor && (
                  <span className="text-body-subtle">{vendor}</span>
                )}
                <h1 className="font-heading font-normal text-[clamp(2rem,5vw,3rem)] uppercase leading-[1.08] tracking-[-0.035em] lg:text-4xl">
                  {title}
                </h1>
              </div>

              {combinedListing ? (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-2xl/none">
                  <span className="flex gap-1">
                    From
                    <VariantPrices
                      variant={{ price: product.priceRange.minVariantPrice }}
                      showCompareAtPrice={false}
                      className="font-heading font-normal"
                    />
                  </span>
                  <span className="flex gap-1">
                    To
                    <VariantPrices
                      variant={{ price: product.priceRange.maxVariantPrice }}
                      showCompareAtPrice={false}
                      className="font-heading font-normal"
                    />
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 font-heading font-normal text-2xl">
                  {isDiscounted(
                    selectedVariant.price as MoneyV2,
                    selectedVariant.compareAtPrice as MoneyV2,
                  ) &&
                    showSalePrice && (
                      <CompareAtPrice
                        data={selectedVariant.compareAtPrice as MoneyV2}
                        className="text-body-subtle"
                      />
                    )}
                  <Money
                    withoutTrailingZeros
                    data={selectedVariant.price}
                    as="span"
                  />
                </div>
              )}

              {showLowInventory && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <p className="text-sm">
                    {lowInventoryText.replace(
                      "[quantity]",
                      String(quantityAvailable),
                    )}
                  </p>
                  <div
                    className="h-1 overflow-hidden rounded-full bg-line-subtle"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-body transition-[width]"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(
                            100,
                            ((quantityAvailable || 0) / inventoryThreshold) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-7">
                {showProductRating && <ProductRating linkToReviews />}

                {isBundle && (
                  <div className="space-y-3">
                    <h4 className="text-2xl">{t("product.bundledProducts")}</h4>
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

                {!combinedListing && selectedVariant && (
                  <SellingPlanSelector
                    variant={selectedVariant}
                    selectedSellingPlanId={selectedSellingPlanId}
                    onSellingPlanChange={setSelectedSellingPlanId}
                  />
                )}
              </div>

              {!combinedListing && (
                <div
                  className="sp-button space-y-3"
                  style={
                    {
                      "--shop-pay-button-height": "54px",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex gap-3">
                    <Quantity
                      value={quantity}
                      onChange={setQuantity}
                      maxQuantity={maxQuantity}
                      variant="stepper"
                      className="w-[34%] shrink-0"
                    />
                    <AddToCartButton
                      width="auto"
                      containerClassName="min-w-0 flex-1"
                      disabled={!selectedVariant?.availableForSale}
                      lines={[
                        {
                          merchandiseId: selectedVariant?.id,
                          quantity,
                          selectedVariant,
                          ...(selectedSellingPlanId && {
                            sellingPlanId: selectedSellingPlanId,
                          }),
                        },
                      ]}
                      data-test="add-to-cart"
                      className="h-[54px] w-full rounded-lg uppercase"
                      onClick={() => {
                        if (
                          selectedSellingPlanId &&
                          typeof window !== "undefined" &&
                          (window as any).gtag
                        ) {
                          (window as any).gtag(
                            "event",
                            "subscription_added_to_cart",
                            {
                              event_category: "ecommerce",
                              product_id: product?.id,
                              variant_id: selectedVariant?.id,
                              selling_plan_id: selectedSellingPlanId,
                              value: selectedVariant?.price?.amount,
                              currency: selectedVariant?.price?.currencyCode,
                            },
                          );
                        }
                      }}
                    >
                      {atcButtonText}
                    </AddToCartButton>
                    {showWishlist && (
                      <ProductWishlistButton
                        productId={product.id}
                        productTitle={title}
                      />
                    )}
                  </div>
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
                  {selectedVariant?.availableForSale && (
                    <LoyaltyPointsHint
                      amount={
                        Number.parseFloat(
                          selectedVariant.price?.amount || "0",
                        ) * quantity
                      }
                    />
                  )}
                  <BackInStockForm
                    variantId={selectedVariant?.id}
                    availableForSale={selectedVariant?.availableForSale}
                    enabled={showBackInStockForm}
                  />
                </div>
              )}

              <ProductDetails
                showShippingPolicy={showShippingPolicy}
                showRefundPolicy={showRefundPolicy}
                showShortDescription={showShortDescription}
                descriptionTitle={descriptionTitle}
                openDescriptionByDefault={openDescriptionByDefault}
                product={product}
              />
            </div>
          </div>
        </div>

        {showProductStory && (
          <ProductStory
            heroImage={storyHeroImage}
            heroImageMobile={storyHeroImageMobile}
            firstImage={storyFirstImage}
            firstHeading={storyFirstHeading}
            secondImage={storySecondImage}
            secondHeading={storySecondHeading}
            media={product.media?.nodes || []}
          />
        )}

        {showProductReviews && (
          <div className="hidden px-0 py-20 md:block md:px-2 md:py-24 lg:px-0">
            <ReviewIndex
              title={reviewsTitle}
              description={reviewsDescription}
            />
          </div>
        )}
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
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "verticalPadding"),
    },
    {
      group: "Product Media",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Aspect ratio",
          defaultValue: "1/1",
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
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "grid",
        },
        {
          label: "Show thumbnails",
          name: "showThumbnails",
          type: "switch",
          defaultValue: false,
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
          defaultValue: "sides",
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
          defaultValue: "rounded-sm",
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
          defaultValue: "Add to bag",
          placeholder: "Add to bag",
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
          label: "Show customer wishlist",
          name: "showWishlist",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show back-in-stock form",
          name: "showBackInStockForm",
          defaultValue: true,
          helpText:
            "Appears when the selected variant is sold out and Klaviyo is configured. See docs/integrations.md.",
        },
        {
          type: "switch",
          label: "Show low inventory status",
          name: "showInventoryStatus",
          defaultValue: true,
        },
        {
          type: "range",
          label: "Low inventory threshold",
          name: "lowInventoryThreshold",
          defaultValue: 10,
          configs: {
            min: 1,
            max: 50,
            step: 1,
          },
          condition: (data: ProductInformationData) =>
            data.showInventoryStatus === true,
        },
        {
          type: "text",
          label: "Low inventory text",
          name: "lowInventoryText",
          defaultValue: "Hurry up! Only [quantity] items in stock.",
          helpText: "Use [quantity] to show the selected variant stock.",
          condition: (data: ProductInformationData) =>
            data.showInventoryStatus === true,
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
        {
          type: "text",
          label: "Description accordion title",
          name: "descriptionTitle",
          defaultValue: "Dimensions",
        },
        {
          type: "switch",
          label: "Open description by default",
          name: "openDescriptionByDefault",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Product story",
      inputs: [
        {
          type: "switch",
          label: "Show product story",
          name: "showProductStory",
          defaultValue: true,
        },
        {
          type: "image",
          label: "Lifestyle image",
          name: "storyHeroImage",
          helpText: "Falls back to the second product media image.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
        {
          type: "image",
          label: "Lifestyle image on mobile",
          name: "storyHeroImageMobile",
          helpText: "Optional square crop for mobile.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
        {
          type: "image",
          label: "First feature image",
          name: "storyFirstImage",
          helpText: "Falls back to the third product media image.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
        {
          type: "textarea",
          label: "First feature heading",
          name: "storyFirstHeading",
          defaultValue:
            "WHETHER A LAVISH VELVET SOFA, A BOLD-HUED BROCADE CHAISE.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
        {
          type: "image",
          label: "Second feature image",
          name: "storySecondImage",
          helpText: "Falls back to the first product media image.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
        {
          type: "textarea",
          label: "Second feature heading",
          name: "storySecondHeading",
          defaultValue:
            "TACTILE FABRIC TRENDS HAVE ALSO EXPANDED TO A BROADER UNIVERSE.",
          condition: (data: ProductInformationData) =>
            data.showProductStory === true,
        },
      ],
    },
    {
      group: "Product reviews",
      inputs: [
        {
          type: "switch",
          label: "Show star rating",
          name: "showProductRating",
          defaultValue: true,
          helpText:
            "Shows the Judge.me star rating under the price. Clicking it scrolls to the reviews.",
        },
        {
          type: "switch",
          label: "Show product reviews",
          name: "showProductReviews",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Reviews heading",
          name: "reviewsTitle",
          defaultValue: "Customer Reviews",
          condition: (data: ProductInformationData) =>
            data.showProductReviews === true,
        },
        {
          type: "text",
          label: "Reviews description",
          name: "reviewsDescription",
          defaultValue:
            "Read what our customers are saying about this product.",
          condition: (data: ProductInformationData) =>
            data.showProductReviews === true,
        },
      ],
    },
  ],
  presets: {
    mediaLayout: "slider",
    gridSize: "2x2",
    imageAspectRatio: "1/1",
    showThumbnails: false,
    showDots: true,
    navigationStyle: "sides",
    arrowsShape: "rounded-sm",
    addToCartText: "Add to bag",
    showWishlist: true,
    showProductStory: true,
    showProductRating: true,
    showProductReviews: true,
  },
});
