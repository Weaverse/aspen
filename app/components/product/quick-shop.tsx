import { CaretLeftIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  mapSelectedProductOptionToObject,
  ShopPayButton,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductVariantFragment } from "storefront-api.generated";
import Link from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { BackInStockForm } from "~/components/product/back-in-stock-form";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { QuickShopVariants } from "~/components/product/quick-shop-variants";
import { ScrollArea } from "~/components/scroll-area";
import { Skeleton } from "~/components/skeleton";
import { SellingPlanSelector } from "~/components/subscriptions/selling-plan-selector";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { ProductData } from "~/routes/($locale).api.product";
import { isDiscounted } from "~/utils/product";
import { CompareAtPrice } from "./variant-prices";

// Helper function from ProductDetails
function getExcerpt(text: string) {
  const regex = /<p.*>(.*?)<\/p>/;
  const match = regex.exec(text);
  return match?.length ? match[0] : text;
}

// Product Details Content component that accepts data as props
function ProductDetailsContent({
  data,
  showShippingPolicy = true,
  showRefundPolicy = true,
}: {
  data: ProductData;
  showShippingPolicy?: boolean;
  showRefundPolicy?: boolean;
}) {
  const { t } = useTranslation();
  const { shop, product } = data;

  const { description, summary } = product;
  const { shippingPolicy, refundPolicy } = shop || {};

  const details = [
    summary && { title: t("product.summary"), content: summary },
    description && { title: t("product.description"), content: description },
    showShippingPolicy &&
      shippingPolicy?.body && {
        title: t("product.shipping"),
        content: getExcerpt(shippingPolicy.body),
        learnMore: `/policies/${shippingPolicy.handle}`,
      },
    showRefundPolicy &&
      refundPolicy?.body && {
        title: t("product.returns"),
        content: getExcerpt(refundPolicy.body),
        learnMore: `/policies/${refundPolicy.handle}`,
      },
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-9 px-6">
      {details.map(({ title, content, learnMore }) => (
        <div key={title} className="flex w-full flex-col items-center gap-6">
          <span className="w-full font-normal uppercase">{title}</span>
          <div
            suppressHydrationWarning
            className="prose prose-sm prose-neutral w-full max-w-none font-normal [&>ol]:mb-4 [&>p]:mb-4 [&>ul]:mb-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {learnMore && (
            <Link
              className="w-full border-line-subtle border-b pb-px text-body-subtle text-sm"
              to={learnMore}
            >
              {t("product.learnMore")}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// Product Description Drawer Component
function ProductDescriptionDrawer({
  data,
  open,
  onOpenChange,
  onCloseAll,
}: {
  data: ProductData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAll?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay forceMount>
                <motion.div
                  className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="fixed inset-y-3 right-5 z-20 max-h-[calc(100vh-36px)]"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 150,
                  }}
                  className="h-full w-screen max-w-[400px] overflow-hidden rounded-(--radius-md) bg-background py-2.5"
                >
                  <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenChange(false)}
                          className="flex h-4 w-4 items-center justify-center"
                        >
                          <CaretLeftIcon className="h-4 w-4 text-[#29231E]" />
                        </button>
                        <Dialog.Title asChild>
                          <span className="font-semibold uppercase tracking-[0.02em]">
                            {t("product.description")}
                          </span>
                        </Dialog.Title>
                      </div>
                      <button
                        type="button"
                        onClick={onCloseAll || (() => onOpenChange(false))}
                        className="flex h-4 w-4 items-center justify-center"
                      >
                        <XIcon className="h-4 w-4 text-[#29231E]" />
                      </button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1" size="sm">
                      <div className="px-5 py-4">
                        <ProductDetailsContent
                          data={data}
                          showShippingPolicy={true}
                          showRefundPolicy={true}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function QuickShop({
  data,
  showDescription,
  setShowDescription,
  onCloseAll,
}: {
  data: ProductData;
  showDescription?: boolean;
  setShowDescription?: (show: boolean) => void;
  onCloseAll?: () => void;
}) {
  const { t } = useTranslation();
  const themeSettings = useThemeSettings();
  const { product, storeDomain } = data || {};
  const [internalShowDescription, setInternalShowDescription] = useState(false);

  const isDescriptionOpen = showDescription ?? internalShowDescription;
  const setDescriptionOpen = setShowDescription ?? setInternalShowDescription;

  // Internal variant state for QuickShop - not tied to URL
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.selectedOrFirstAvailableVariant?.id || null,
  );

  // Find the selected variant from the adjacent variants (which includes all product variants)
  const adjacentVariants = getAdjacentAndFirstAvailableVariants(product);
  const selectedVariant =
    adjacentVariants.find((variant) => variant.id === selectedVariantId) ||
    product?.selectedOrFirstAvailableVariant;

  // Get the product options array with our internally selected variant
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<
    string | null
  >(null);
  const {
    enableZoom,
    addToCartText,
    soldOutText,
    unavailableText,
    showCompareAtPrice,
    hideUnavailableOptions,
    enableQuickShopBackInStock = true,
    quickShopNavigationStyle,
    quickShopArrowsColor,
    quickShopArrowsShape,
    quickShopArrowsZoomColor,
    quickShopArrowsZoomShape,
    quickShopZoomColor,
    quickShopZoomShape,
  } = themeSettings;

  const { title } = product;
  const atcText = selectedVariant?.availableForSale
    ? addToCartText
    : selectedVariant?.quantityAvailable === -1
      ? unavailableText
      : soldOutText;
  const { price, compareAtPrice } = selectedVariant;
  return (
    <>
      <div
        className="space-y-6"
        style={{ "--shop-pay-button-height": "54px" } as React.CSSProperties}
      >
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <div className="[&_.swiper]:!h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full absolute inset-0">
            <ProductMedia
              mediaLayout="slider"
              media={product?.media.nodes}
              selectedVariant={selectedVariant}
              showThumbnails={false}
              imageAspectRatio={"1/1"}
              enableZoom={enableZoom}
              navigationStyle={quickShopNavigationStyle}
              arrowsZoomColor={quickShopArrowsZoomColor}
              arrowsZoomShape={quickShopArrowsZoomShape}
              arrowsColor={quickShopArrowsColor}
              arrowsShape={quickShopArrowsShape}
              zoomColor={quickShopZoomColor}
              zoomShape={quickShopZoomShape}
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Product Title & Price */}
          <h4 className="line-clamp-2 font-medium leading-tight">{title}</h4>
          <button
            type="button"
            className="cursor-pointer underline"
            onClick={() => setDescriptionOpen(true)}
          >
            <span>{t("product.viewDescription")}</span>
          </button>
          <div className="space-y-7 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
            {selectedVariant && (
              <div className="flex justify-between">
                <span className="font-semibold uppercase tracking-[0.02em]">
                  {t("product.price")}
                </span>
                <div className={"flex gap-2"}>
                  <Money withoutTrailingZeros data={price} />
                  {showCompareAtPrice &&
                    isDiscounted(
                      price as MoneyV2,
                      compareAtPrice as MoneyV2,
                    ) && <CompareAtPrice data={compareAtPrice as MoneyV2} />}
                </div>
              </div>
            )}
            {productOptions && productOptions.length > 0 && (
              <QuickShopVariants
                productOptions={productOptions}
                onVariantChange={setSelectedVariantId}
              />
            )}
            <Quantity value={quantity} onChange={setQuantity} />
            {selectedVariant && (
              <SellingPlanSelector
                variant={selectedVariant}
                selectedSellingPlanId={selectedSellingPlanId}
                onSellingPlanChange={setSelectedSellingPlanId}
                product={product}
              />
            )}
          </div>
          <div className="space-y-3">
            <AddToCartButton
              disabled={!selectedVariant?.availableForSale}
              onAdded={onCloseAll}
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
              className="h-[54px] w-full"
            >
              {atcText}
            </AddToCartButton>

            {selectedVariant?.availableForSale && (
              <ShopPayButton
                width="100%"
                variantIdsAndQuantities={[
                  {
                    id: selectedVariant?.id,
                    quantity,
                    ...(selectedSellingPlanId && {
                      sellingPlanId: selectedSellingPlanId,
                    }),
                  },
                ]}
                className="h-[54px] w-full"
                storeDomain={storeDomain}
              />
            )}
            {selectedVariant?.availableForSale && (
              <LoyaltyPointsHint
                amount={
                  Number.parseFloat(selectedVariant.price?.amount || "0") *
                  quantity
                }
              />
            )}
            <BackInStockForm
              variantId={selectedVariant?.id}
              availableForSale={selectedVariant?.availableForSale}
              enabled={enableQuickShopBackInStock}
            />
          </div>
        </div>
      </div>

      {/* Product Description Drawer */}
      {product && (
        <ProductDescriptionDrawer
          data={data}
          open={isDescriptionOpen}
          onOpenChange={setDescriptionOpen}
          onCloseAll={onCloseAll}
        />
      )}
    </>
  );
}

export function QuickShopTrigger({
  productHandle,
  selectedOptions = [],
  showOnHover = true,
}: {
  productHandle: string;
  selectedOptions?: ProductVariantFragment["selectedOptions"];
  showOnHover?: boolean;
}) {
  const { t } = useTranslation();
  const { quickShopButtonTextOpen } = useThemeSettings();
  const triggerLabel = quickShopButtonTextOpen || t("product.selectOptions");
  const [open, setOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const { load, data, state } = useFetcher<ProductData>();
  const optionParams = new URLSearchParams(
    mapSelectedProductOptionToObject(selectedOptions),
  );
  optionParams.set("handle", productHandle);
  const apiPath = usePrefixPathWithLocale(
    `/api/product?${optionParams.toString()}`,
  );

  const closeAllDrawers = () => {
    setShowDescription(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || state === "loading" || loadedPath === apiPath) {
      return;
    }

    setLoadedPath(apiPath);
    load(apiPath);
  }, [apiPath, load, loadedPath, open, state]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={clsx(
            "absolute right-3 bottom-3 z-10 flex size-11 items-center justify-center rounded-(--radius-sm) bg-white p-0 shadow-xs",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
            showOnHover
              ? "lg:inset-x-4 lg:bottom-4 lg:h-11 lg:w-auto lg:translate-y-2 lg:opacity-0"
              : "lg:inset-x-4 lg:bottom-4 lg:h-11 lg:w-auto lg:opacity-100",
            "lg:rounded-(--radius-xs) lg:px-6 lg:py-3",
            "lg:border-(--btn-primary-bg) lg:bg-(--btn-primary-bg) lg:text-(--btn-primary-text)",
            showOnHover
              ? "lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
              : "",
            "transition-[opacity,transform,background-color] duration-300 lg:whitespace-nowrap lg:font-normal lg:leading-none",
          )}
        >
          {/* Shopping bag icon for mobile/tablet */}
          <svg
            className="h-5 w-5 text-[#29231E] lg:hidden"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          {/* Text for desktop */}
          <span className="hidden uppercase lg:inline">{triggerLabel}</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay forceMount>
                <motion.div
                  className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="fixed inset-y-3 right-5 z-10 max-h-[calc(100vh-36px)]"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 150,
                  }}
                  className="h-full w-screen max-w-[400px] overflow-hidden rounded-(--radius-md) bg-background py-2.5"
                >
                  <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
                      <Dialog.Title asChild>
                        <span className="font-semibold uppercase tracking-[0.02em]">
                          {t("product.quickShop")}
                        </span>
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={closeAllDrawers}
                        aria-label={t("product.closeQuickShop")}
                        className="rounded p-1 transition-colors hover:bg-gray-100"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1" size="sm">
                      <div className="px-5 py-4">
                        {state === "loading" ? (
                          <div className="space-y-6">
                            {/* Image skeleton */}
                            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                              <Skeleton className="h-full w-full" />
                            </div>

                            {/* Content skeleton */}
                            <div className="space-y-6">
                              {/* Title & Price */}
                              <div className="space-y-3">
                                <Skeleton className="h-7 w-3/4" />
                                <Skeleton className="h-6 w-1/3" />
                              </div>

                              {/* Variants */}
                              <div className="space-y-3">
                                <Skeleton className="h-5 w-1/4" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-10 w-12" />
                                  <Skeleton className="h-10 w-12" />
                                  <Skeleton className="h-10 w-12" />
                                </div>
                              </div>

                              {/* Quantity & Buttons */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-10 w-24" />
                                </div>
                                <Skeleton className="h-12 w-full" />
                              </div>
                            </div>
                          </div>
                        ) : data ? (
                          <QuickShop
                            data={data as ProductData}
                            showDescription={showDescription}
                            setShowDescription={setShowDescription}
                            onCloseAll={closeAllDrawers}
                          />
                        ) : (
                          <div className="space-y-4 py-8 text-center">
                            <p className="text-body-subtle">
                              {t("product.loadError")}
                            </p>
                            <button
                              type="button"
                              className="underline underline-offset-4"
                              onClick={() => load(apiPath)}
                            >
                              {t("system.tryAgain")}
                            </button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
