import { PackageIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  mapSelectedProductOptionToObject,
  ShopPayButton,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductVariantFragment } from "storefront-api.generated";
import Link from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { BackInStockForm } from "~/components/product/back-in-stock-form";
import { ProductBadges } from "~/components/product/badges";
import { ProductCardRating } from "~/components/product/product-card-rating";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { QuickShopVariants } from "~/components/product/quick-shop-variants";
import { ScrollArea } from "~/components/scroll-area";
import { Skeleton } from "~/components/skeleton";
import { SellingPlanSelector } from "~/components/subscriptions/selling-plan-selector";
import { ProductCardWishlistButton } from "~/components/wishlist/product-card-wishlist-button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import type { ProductData } from "~/routes/($locale).api.product";
import { MEDIA_MOBILE } from "~/utils/breakpoints";
import { isDiscounted } from "~/utils/product";
import { CompareAtPrice, VariantPrices } from "./variant-prices";

const LOW_STOCK_THRESHOLD = 10;

function StockIndicator({
  quantityAvailable,
}: {
  quantityAvailable?: number | null;
}) {
  const { t } = useTranslation();
  if (
    typeof quantityAvailable !== "number" ||
    quantityAvailable <= 0 ||
    quantityAvailable > LOW_STOCK_THRESHOLD
  ) {
    return null;
  }

  const fillPercent = Math.max(
    8,
    Math.round((quantityAvailable / LOW_STOCK_THRESHOLD) * 100),
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">
        {t("product.lowStock", { count: quantityAvailable })}
      </span>
      <div className="h-1 w-full rounded-full bg-[#DFDFDF]">
        <div
          className="h-1 rounded-full bg-(--color-text-subtle)"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

export function QuickShop({
  data,
  onCloseAll,
}: {
  data: ProductData;
  showDescription?: boolean;
  setShowDescription?: (show: boolean) => void;
  onCloseAll?: () => void;
}) {
  const { t } = useTranslation();
  const themeSettings = useTranslatedThemeSettings();
  const { product, storeDomain } = data || {};

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.selectedOrFirstAvailableVariant?.id || null,
  );

  const adjacentVariants = getAdjacentAndFirstAvailableVariants(product);
  const selectedVariant =
    adjacentVariants.find((variant) => variant.id === selectedVariantId) ||
    product?.selectedOrFirstAvailableVariant;

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<
    string | null
  >(null);
  const {
    addToCartText,
    soldOutText,
    unavailableText,
    showCompareAtPrice,
    enableQuickShopBackInStock = true,
    showBadgesOnProductMedia,
    quickShopArrowsColor = "primary",
    quickShopArrowsShape = "circle",
  } = themeSettings;

  const { title } = product;
  const atcText = selectedVariant?.availableForSale
    ? addToCartText
    : selectedVariant?.quantityAvailable === -1
      ? unavailableText
      : soldOutText;

  return (
    <div
      className="flex flex-col gap-6 font-body"
      style={{ "--shop-pay-button-height": "54px" } as React.CSSProperties}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        <div className="[&_.swiper]:!h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-xl [&_img]:!object-cover absolute inset-0">
          <ProductMedia
            mediaLayout="slider"
            media={product?.media.nodes}
            selectedVariant={selectedVariant}
            showThumbnails={false}
            showDots={false}
            imageAspectRatio="1/1"
            navigationStyle="sides"
            arrowsColor={quickShopArrowsColor}
            arrowsShape={quickShopArrowsShape}
            navigationVariant="quick-shop"
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
        {product?.id && (
          <ProductCardWishlistButton
            productId={product.id}
            productTitle={title}
            showOnMobile
            showOnTablet
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 text-sm">
        <div className="flex flex-col gap-4">
          <h4 className="break-words font-heading font-normal text-(--color-text) uppercase">
            {title}
          </h4>
          {selectedVariant && (
            <VariantPrices
              variant={selectedVariant}
              showCompareAtPrice={showCompareAtPrice}
              spacedCurrency
              compareAtFirst
              className="gap-3 font-heading font-normal text-2xl leading-none"
              compareAtPriceClassName="text-body-subtle"
            />
          )}
        </div>

        <StockIndicator
          quantityAvailable={selectedVariant?.quantityAvailable}
        />

        <ProductCardRating
          ratingValue={product.reviewRating?.value}
          ratingCountValue={product.reviewRatingCount?.value}
          className="gap-2.5 leading-none"
          useDotDecimal
        />

        <div className="flex flex-col gap-6">
          {productOptions && productOptions.length > 0 && (
            <QuickShopVariants
              productOptions={productOptions}
              onVariantChange={setSelectedVariantId}
              layout="buttons"
            />
          )}
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
          <div className="flex gap-3">
            <Quantity
              value={quantity}
              onChange={setQuantity}
              variant="stepper"
              className="w-1/3 min-w-24 shrink-0 bg-[#DFDFDF]"
            />
            <AddToCartButton
              width="auto"
              containerClassName="min-w-0 flex-1"
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
              variant="primary"
              className="h-[54px] w-full rounded-lg uppercase"
            >
              {atcText}
            </AddToCartButton>
          </div>
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

        <div className="flex w-fit max-w-full items-center gap-2.5 rounded-lg bg-(--color-background) text-(--color-text-subtle) text-sm">
          <PackageIcon aria-hidden="true" className="size-5 shrink-0" />
          <span className="min-w-0">{t("product.estimatedDelivery")}</span>
        </div>

        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="w-fit text-(--color-text-subtle) text-sm underline underline-offset-2"
        >
          {t("product.viewFullDetails")}
        </Link>
      </div>
    </div>
  );
}

// Tablet and desktop share purchase logic with responsive modal layouts.
// Keep this presentation separate from the mobile drawer.
function QuickShopDesktop({
  data,
  onCloseAll,
}: {
  data: ProductData;
  onCloseAll?: () => void;
}) {
  const { t } = useTranslation();
  const themeSettings = useTranslatedThemeSettings();
  const { product, storeDomain } = data || {};

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.selectedOrFirstAvailableVariant?.id || null,
  );
  const adjacentVariants = getAdjacentAndFirstAvailableVariants(product);
  const selectedVariant =
    adjacentVariants.find((variant) => variant.id === selectedVariantId) ||
    product?.selectedOrFirstAvailableVariant;

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<
    string | null
  >(null);
  const {
    addToCartText,
    soldOutText,
    unavailableText,
    showCompareAtPrice,
    showBadgesOnProductMedia,
    quickShopArrowsColor = "primary",
    quickShopArrowsShape = "circle",
  } = themeSettings;

  const { title } = product;
  const atcText = selectedVariant?.availableForSale
    ? addToCartText
    : selectedVariant?.quantityAvailable === -1
      ? unavailableText
      : soldOutText;
  const { price, compareAtPrice } = selectedVariant;

  return (
    <div className="grid grid-cols-2 items-start gap-6 font-body lg:grid-cols-[minmax(0,1.48fr)_minmax(0,1fr)]">
      {/* Gallery */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
        <div className="[&_.swiper]:!h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-xl [&_img]:!object-cover absolute inset-0">
          <ProductMedia
            mediaLayout="slider"
            media={product?.media.nodes}
            selectedVariant={selectedVariant}
            showThumbnails={false}
            showDots
            imageAspectRatio="1/1"
            navigationStyle="sides"
            arrowsColor={quickShopArrowsColor}
            arrowsShape={quickShopArrowsShape}
            navigationVariant="quick-shop"
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
        {product?.id && (
          <ProductCardWishlistButton
            productId={product.id}
            productTitle={title}
            showOnTablet
          />
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col gap-8 text-sm">
        <div className="flex flex-col gap-4">
          <h4 className="pr-5 font-heading font-normal text-(--color-text) uppercase">
            {title}
          </h4>
          {selectedVariant && (
            <div className="flex items-center gap-3 font-heading font-normal text-2xl">
              {showCompareAtPrice &&
                isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
                  <CompareAtPrice
                    data={compareAtPrice as MoneyV2}
                    className="text-body-subtle"
                  />
                )}
              <Money withoutTrailingZeros data={price} as="span" />
            </div>
          )}
          <ProductCardRating
            ratingValue={product.reviewRating?.value}
            ratingCountValue={product.reviewRatingCount?.value}
            className="gap-2.5 leading-6"
          />
        </div>

        <StockIndicator
          quantityAvailable={selectedVariant?.quantityAvailable}
        />

        <div className="flex flex-col gap-7">
          {productOptions && productOptions.length > 0 && (
            <QuickShopVariants
              productOptions={productOptions}
              onVariantChange={setSelectedVariantId}
              layout="buttons"
            />
          )}
          {selectedVariant && (
            <SellingPlanSelector
              variant={selectedVariant}
              selectedSellingPlanId={selectedSellingPlanId}
              onSellingPlanChange={setSelectedSellingPlanId}
              product={product}
            />
          )}
        </div>

        <div
          className="sp-button space-y-3"
          style={{ "--shop-pay-button-height": "56px" } as React.CSSProperties}
        >
          <div className="flex gap-3">
            <Quantity
              value={quantity}
              onChange={setQuantity}
              variant="stepper"
              className="w-1/3 min-w-24 shrink-0 bg-[#DFDFDF]"
            />
            <AddToCartButton
              width="auto"
              containerClassName="min-w-0 flex-1"
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
              variant="primary"
              className="h-[54px] w-full rounded-lg uppercase"
            >
              {atcText}
            </AddToCartButton>
          </div>
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
        </div>

        <div className="flex w-fit max-w-full items-center gap-2.5 rounded-lg bg-(--color-background) text-(--color-text-subtle) text-sm">
          <PackageIcon aria-hidden="true" className="size-5 shrink-0" />
          <span className="min-w-0">{t("product.estimatedDelivery")}</span>
        </div>

        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="w-fit text-(--color-text-subtle) text-sm underline underline-offset-2"
        >
          {t("product.viewFullDetails")}
        </Link>
      </div>
    </div>
  );
}

export function QuickShopTrigger({
  productHandle,
  selectedOptions = [],
  showOnHover = true,
  iconOnly = false,
}: {
  productHandle: string;
  selectedOptions?: ProductVariantFragment["selectedOptions"];
  showOnHover?: boolean;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  const {
    quickShopButtonTextOpen,
    pcardQuickShopHoverBackground = "#F1EEEA",
    pcardQuickShopHoverText = "#000000",
    pcardCompactShopOnHover = true,
  } = useTranslatedThemeSettings();
  const triggerLabel = quickShopButtonTextOpen || t("product.selectOptions");
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MEDIA_MOBILE);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
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
          style={
            {
              "--pcard-button-hover-bg": pcardQuickShopHoverBackground,
              "--pcard-button-hover-text": pcardQuickShopHoverText,
            } as React.CSSProperties
          }
          className={clsx(
            "absolute right-3 bottom-3 z-10 flex size-12 items-center justify-center gap-2 rounded-xl bg-white p-3",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
            pcardCompactShopOnHover &&
              "max-desktop:[@media(hover:hover)_and_(pointer:fine)]:pointer-events-none max-desktop:[@media(hover:hover)_and_(pointer:fine)]:opacity-0 max-desktop:group-hover/product-card:pointer-events-auto max-desktop:group-hover/product-card:opacity-100 max-desktop:group-focus-within/product-card:pointer-events-auto max-desktop:group-focus-within/product-card:opacity-100",
            !iconOnly &&
              "desktop:inset-x-[3.6556%] desktop:bottom-4 desktop:h-auto desktop:w-auto desktop:rounded-(--radius-sm) desktop:bg-(--btn-primary-bg) desktop:px-6 desktop:py-5 desktop:text-(--btn-primary-text)",
            !iconOnly &&
              "desktop:hover:bg-(--pcard-button-hover-bg) desktop:hover:text-(--pcard-button-hover-text)",
            showOnHover &&
              !iconOnly &&
              "desktop:[@media(hover:hover)_and_(pointer:fine)]:pointer-events-none desktop:[@media(hover:hover)_and_(pointer:fine)]:translate-y-2 desktop:[@media(hover:hover)_and_(pointer:fine)]:opacity-0 desktop:group-hover/product-card:pointer-events-auto desktop:group-hover/product-card:translate-y-0 desktop:group-hover/product-card:opacity-100 desktop:group-focus-within/product-card:pointer-events-auto desktop:group-focus-within/product-card:translate-y-0 desktop:group-focus-within/product-card:opacity-100",
            "transition-[opacity,transform,background-color,color] duration-300 desktop:font-body desktop:text-sm desktop:font-semibold desktop:leading-none desktop:tracking-[0.02em]",
          )}
        >
          {/* Shopping bag icon for mobile and tablet */}
          <svg
            className={clsx(
              "h-5 w-5 text-[#29231E]",
              !iconOnly && "desktop:hidden",
            )}
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
          {!iconOnly && (
            <span className="hidden uppercase desktop:inline">
              {triggerLabel}
            </span>
          )}
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
              {/* Mount only the active dialog so hidden focus traps cannot dismiss it. */}
              {isMobile && (
                <Dialog.Content
                  forceMount
                  className="fixed inset-0 z-10 h-dvh md:hidden"
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
                    className="h-full w-full overflow-hidden rounded-(--radius-md) bg-background"
                  >
                    <div className="relative flex h-full flex-col">
                      <Dialog.Title asChild>
                        <span className="sr-only">
                          {t("product.quickShop")}
                        </span>
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={closeAllDrawers}
                        aria-label={t("product.closeQuickShop")}
                        className="absolute top-4 right-5 z-30 flex size-5 items-center justify-center"
                      >
                        <XIcon className="size-5" />
                      </button>

                      <ScrollArea rootClassName="min-h-0 flex-1" size="sm">
                        <div className="px-5 pt-10 pb-8">
                          {state === "loading" || loadedPath !== apiPath ? (
                            <QuickShopSkeleton />
                          ) : data ? (
                            <QuickShop
                              data={data as ProductData}
                              onCloseAll={closeAllDrawers}
                            />
                          ) : (
                            <QuickShopLoadError onRetry={() => load(apiPath)} />
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </motion.div>
                </Dialog.Content>
              )}

              {/* Tablet and desktop: centered modal */}
              {!isMobile && (
                <Dialog.Content
                  forceMount
                  className="fixed inset-0 z-10 hidden items-center justify-center md:flex"
                  aria-describedby={undefined}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="relative max-h-[calc(100dvh-48px)] w-[calc(100%-48px)] max-w-[1375px] overflow-y-auto rounded-xl bg-background p-6"
                  >
                    <Dialog.Title asChild>
                      <span className="sr-only">{t("product.quickShop")}</span>
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closeAllDrawers}
                      aria-label={t("product.closeQuickShop")}
                      className="absolute top-4 right-4 z-10 flex size-5 items-center justify-center"
                    >
                      <XIcon className="size-5" />
                    </button>
                    {state === "loading" || loadedPath !== apiPath ? (
                      <QuickShopDesktopSkeleton />
                    ) : data ? (
                      <QuickShopDesktop
                        data={data as ProductData}
                        onCloseAll={closeAllDrawers}
                      />
                    ) : (
                      <QuickShopLoadError onRetry={() => load(apiPath)} />
                    )}
                  </motion.div>
                </Dialog.Content>
              )}
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuickShopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-10 w-12" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

function QuickShopDesktopSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-[minmax(0,1.48fr)_minmax(0,1fr)]">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-1/3" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-10 w-12" />
          </div>
        </div>
        <Skeleton className="h-[54px] w-full" />
      </div>
    </div>
  );
}

function QuickShopLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 py-8 text-center">
      <p className="text-body-subtle">{t("product.loadError")}</p>
      <button
        type="button"
        className="underline underline-offset-4"
        onClick={onRetry}
      >
        {t("system.tryAgain")}
      </button>
    </div>
  );
}
