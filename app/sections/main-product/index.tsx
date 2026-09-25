import { PackageIcon } from "@phosphor-icons/react";
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
import { VariantPrices } from "~/components/product/variant-prices";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { SellingPlanSelector } from "~/components/subscriptions/selling-plan-selector";
import { ProductWishlistButton } from "~/components/wishlist/product-wishlist-button";
import { useTranslatedText } from "~/hooks/use-translated-text";
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
  const translateText = useTranslatedText();

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
    addToCartText: rawI18nAddToCartText,
    addBundleToCartText: rawI18nAddBundleToCartText,
    soldOutText: rawI18nSoldOutText,
    showVendor,
    showSalePrice,
    showShortDescription,
    showShippingPolicy,
    showRefundPolicy,
    showInventoryStatus = true,
    showWishlist = true,
    showBackInStockForm = true,
    lowInventoryThreshold = 10,
    lowInventoryText:
      rawI18nLowInventoryText = "Hurry up! Only [quantity] items in stock.",
    descriptionTitle: rawI18nDescriptionTitle = "Dimensions",
    openDescriptionByDefault = true,
    showProductStory = true,
    storyHeroImage,
    storyHeroImageMobile,
    storyFirstImage,
    storyFirstHeading:
      rawI18nStoryFirstHeading = "WHETHER A LAVISH VELVET SOFA, A BOLD-HUED BROCADE CHAISE.",
    storySecondImage,
    storySecondHeading:
      rawI18nStorySecondHeading = "TACTILE FABRIC TRENDS HAVE ALSO EXPANDED TO A BROADER UNIVERSE.",
    showProductRating = true,
    showProductReviews = true,
    reviewsTitle: rawI18nReviewsTitle = "Customer Reviews",
    reviewsDescription:
      rawI18nReviewsDescription = "Read what our customers are saying about this product.",
    mediaLayout,
    gridSize,
    imageAspectRatio,
    showThumbnails: _showThumbnails,
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
  const soldOutText = translateText(
    rawI18nSoldOutText,
    "themeContent.sectionsMainProductIndex.soldOutText",
  );
  const addBundleToCartText = translateText(
    rawI18nAddBundleToCartText,
    "themeContent.sectionsMainProductIndex.addBundleToCartText",
  );
  const addToCartText = translateText(
    rawI18nAddToCartText,
    "themeContent.sectionsMainProductIndex.addToCartText",
  );
  const reviewsDescription = translateText(
    rawI18nReviewsDescription,
    "themeContent.sectionsMainProductIndex.reviewsDescription",
  );
  const reviewsTitle = translateText(
    rawI18nReviewsTitle,
    "themeContent.sectionsMainProductIndex.reviewsTitle",
  );
  const storySecondHeading = translateText(
    rawI18nStorySecondHeading,
    "themeContent.sectionsMainProductIndex.storySecondHeading",
  );
  const storyFirstHeading = translateText(
    rawI18nStoryFirstHeading,
    "themeContent.sectionsMainProductIndex.storyFirstHeading",
  );
  const descriptionTitle = translateText(
    rawI18nDescriptionTitle,
    "themeContent.sectionsMainProductIndex.descriptionTitle",
  );
  const lowInventoryText = translateText(
    rawI18nLowInventoryText,
    "themeContent.sectionsMainProductIndex.lowInventoryText",
  );
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

  if (!product || !selectedVariant) {
    return null;
  }

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
    let atcButtonText = t("product.addToCart");
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
            "space-y-0 lg:flex lg:items-start lg:justify-center lg:gap-[39px] lg:pt-10",
          )}
        >
          <div
            className={clsx(
              "relative h-[430px] min-w-0 flex-[1_0_0] overflow-hidden rounded-[4px] bg-[#d3d3d3] [&_.product-media-slider]:h-full [&_.swiper]:h-full [&_.swiper-slide]:h-full [&_.swiper-wrapper]:h-full [&_img]:object-cover md:aspect-square md:h-auto md:flex-[1_0_0] md:self-stretch md:rounded-[4px] md:bg-[#d3d3d3] lg:aspect-square lg:h-auto lg:w-[778px] lg:max-w-[calc(100%-399px)] lg:flex-none lg:rounded-[var(--Radius-border-radius-md,12px)] lg:bg-transparent",
              width !== "full" &&
                "-mx-(--page-padding) w-[calc(100%+2*var(--page-padding))] lg:mx-0 lg:w-[778px]",
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
              showThumbnails={false}
              enableZoom={enableZoom}
              zoomButtonClassName={
                showWishlist ? "lg:top-auto lg:bottom-6" : undefined
              }
              showDots={showDots}
              navigationStyle={navigationStyle}
              navigationVariant="product-page"
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
              "min-w-0 pt-10 md:flex-[1_0_0] md:pt-10 lg:flex-1 lg:pt-0",
              width === "full" && "px-8 lg:pr-(--page-padding) lg:pl-0",
              width !== "full" && "px-3 md:px-0 lg:px-0",
            )}
          >
            <div
              className="flex flex-col justify-start gap-0 md:flex-[1_0_0] md:items-start md:justify-center md:gap-8 lg:sticky lg:flex-none lg:items-stretch lg:justify-start lg:gap-0"
              data-product-detail-content
              style={{ top: "calc(var(--height-nav) + 24px)" }}
            >
              <div className="w-full space-y-8 md:space-y-4">
                <div className="flex flex-col gap-2">
                  {showVendor && vendor && (
                    <span className="text-body-subtle">{vendor}</span>
                  )}
                  <h1 className="flex-[1_0_0] font-heading font-normal text-[44px] text-[#343231] uppercase leading-[1.1] tracking-[-1.32px]">
                    {title}
                  </h1>
                </div>

                {combinedListing ? (
                  <div className="flex items-center gap-1 font-heading font-normal text-2xl/none">
                    <span>{t("product.from")}</span>
                    <VariantPrices
                      variant={{ price: product.priceRange.minVariantPrice }}
                      showCompareAtPrice={false}
                      spacedCurrency
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-heading font-normal text-2xl leading-[normal]">
                    {isDiscounted(
                      selectedVariant.price as MoneyV2,
                      selectedVariant.compareAtPrice as MoneyV2,
                    ) &&
                      showSalePrice && (
                        <Money
                          withoutTrailingZeros
                          data={selectedVariant.compareAtPrice as MoneyV2}
                          as="span"
                          className="text-body-subtle line-through lg:text-2xl lg:leading-[normal]"
                        />
                      )}
                    <Money
                      withoutTrailingZeros
                      data={selectedVariant.price}
                      as="span"
                      className="text-[#1A1A1A] lg:text-2xl lg:leading-[normal]"
                    />
                  </div>
                )}
              </div>

              {showProductRating && (
                <ProductRating
                  linkToReviews
                  productDetailsLayout
                  className="mt-4 md:mt-0 lg:mt-4"
                />
              )}

              {showLowInventory && (
                <div
                  className="mt-8 w-full space-y-2 md:mt-0 lg:mt-8"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-body text-sm leading-[1.6] tracking-[0.14px] text-[#282123]">
                    {lowInventoryText.replace(
                      "[quantity]",
                      String(quantityAvailable),
                    )}
                  </p>
                  <div
                    className="flex h-1 overflow-hidden rounded-[var(--border-radius-sm,4px)] bg-line-subtle"
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

              <div className="mt-8 w-full space-y-7 md:mt-0 lg:mt-7">
                {isBundle && (
                  <div className="space-y-3">
                    <h4 className="text-2xl">{t("product.bundledProducts")}</h4>
                    <BundledVariants
                      variants={bundledVariants as ProductVariantComponent[]}
                    />
                  </div>
                )}

                <ProductVariants
                  productDetailSwatches
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
                  className="sp-button mt-8 w-full space-y-3 md:mt-0 lg:mt-8"
                  style={
                    {
                      "--shop-pay-button-height": "54px",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-[var(--p-12,12px)]">
                    <Quantity
                      value={quantity}
                      onChange={setQuantity}
                      maxQuantity={maxQuantity}
                      variant="stepper"
                      className="w-[132px] min-w-[132px] shrink-0 grid-cols-[44px_44px_44px] md:flex! md:h-[54px] md:w-[256.667px] md:min-w-[256.667px] md:items-start md:[&>*]:w-auto md:[&>*]:flex-1 lg:grid! lg:w-[132px] lg:min-w-[132px] lg:grid-cols-[44px_44px_44px] lg:[&>*]:w-11 lg:[&>*]:flex-none"
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
                      className="h-[54px] w-full rounded-[var(--Radius-border-radius-sm,8px)] bg-[var(--Primary-Background,#4D4946)] px-6 py-5 uppercase"
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
                    <div className="!mt-8 flex items-center gap-2.5 text-body-subtle text-sm">
                      <PackageIcon
                        aria-hidden="true"
                        className="size-5 shrink-0"
                      />
                      <span>{t("product.estimatedDelivery")}</span>
                    </div>
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
                className="mt-[27px] w-full md:mt-0 lg:mt-[27px]"
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
          <div className="hidden px-0 pt-16 md:block md:px-0 md:py-20 lg:flex lg:flex-col lg:items-center lg:self-stretch lg:px-20 lg:py-20">
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
      {t("product.noData")}
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
          condition: (data: ProductInformationData) =>
            data.mediaLayout === "grid",
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
