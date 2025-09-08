import { CaretLeftIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  ShopPayButton,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { QuickShopVariants } from "~/components/product/quick-shop-variants";
import { ScrollArea } from "~/components/scroll-area";
import { Skeleton } from "~/components/skeleton";
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
  const { shop, product } = data;

  const { description, summary } = product;
  const { shippingPolicy, refundPolicy } = shop || {};

  const details = [
    summary && { title: "SUMMARY", content: summary },
    description && { title: "DESCRIPTION", content: description },
    showShippingPolicy &&
      shippingPolicy?.body && {
        title: "SHIPPING",
        content: getExcerpt(shippingPolicy.body),
        learnMore: `/policies/${shippingPolicy.handle}`,
      },
    showRefundPolicy &&
      refundPolicy?.body && {
        title: "RETURNS",
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
              Learn more
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
  const { product } = data;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-20 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 z-20 w-full bg-background py-2.5 md:max-w-[430px]",
            "right-0 shadow-2xl data-[state=open]:animate-enter-from-right",
          ])}
          aria-describedby={undefined}
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
                  <span className="font-semibold uppercase">DESCRIPTION</span>
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
        </Dialog.Content>
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
  const {
    enableZoom,
    addToCartText,
    soldOutText,
    unavailableText,
    showCompareAtPrice,
    hideUnavailableOptions,
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
        style={{ "--shop-pay-button-height": "48px" } as React.CSSProperties}
      >
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          <div className="[&_.swiper]:!h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full absolute inset-0">
            <ProductMedia
              mediaLayout="slider"
              media={product?.media.nodes}
              selectedVariant={selectedVariant}
              showThumbnails={false}
              imageAspectRatio={"1/1"}
              enableZoom={enableZoom}
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
            <span>View Description</span>
          </button>
          <div className="space-y-7 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
            {selectedVariant && (
              <div className="flex justify-between">
                <span className="font-normal uppercase">Price</span>
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
          </div>
          <div className="space-y-3">
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
              className="h-12 w-full"
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
                  },
                ]}
                className="h-12 w-full"
                storeDomain={storeDomain}
              />
            )}
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
  showOnHover = true,
  buttonType,
  buttonText,
  panelType,
}: {
  productHandle: string;
  showOnHover?: boolean;
  buttonType?: string;
  buttonText?: string;
  panelType?: string;
}) {
  const { quickShopButtonTextOpen } = useThemeSettings();
  const [open, setOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { load, data, state } = useFetcher<ProductData>();
  const apiPath = usePrefixPathWithLocale(
    `/api/product?handle=${productHandle}`,
  );

  const closeAllDrawers = () => {
    setShowDescription(false);
    setOpen(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: open and state are intentionally excluded
  useEffect(() => {
    if (open && !data && state !== "loading") {
      load(apiPath);
    }
  }, [open, apiPath]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setOpen(isOpen);
        } else {
          closeAllDrawers();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            // Mobile/Tablet: Always visible circular button at bottom right
            "absolute right-4 bottom-4 md:opacity-100",
            "rounded-full bg-white",
            "flex items-center justify-center p-0",
            // Desktop: Hide initially, show on hover with text
            showOnHover
              ? "lg:inset-x-4 lg:h-auto lg:w-auto lg:rounded-none lg:opacity-0"
              : "lg:inset-x-4 lg:h-auto lg:w-auto lg:rounded-none lg:opacity-100",
            "lg:px-6 lg:py-5",
            "lg:border-(--btn-secondary-bg) lg:bg-(--btn-secondary-bg) lg:text-(--btn-secondary-text)",
            showOnHover
              ? "lg:-translate-y-1.5 lg:-translate-x-2 lg:group-hover:translate-x-0 lg:group-hover:translate-y-2 lg:group-hover:opacity-100"
              : "",
            "lg:whitespace-nowrap lg:font-normal lg:leading-3.5",
          )}
        >
          {/* Shopping bag icon for mobile/tablet */}
          <svg
            className="h-5 w-5 text-[#29231E] lg:hidden"
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
          <span className="hidden uppercase lg:inline">
            {buttonText || quickShopButtonTextOpen}
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 z-10 w-full bg-background py-2.5 md:max-w-[430px]",
            "right-0 shadow-2xl data-[state=open]:animate-enter-from-right",
          ])}
          aria-describedby={undefined}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
              <Dialog.Title asChild>
                <span className="font-semibold uppercase">Quick Shop</span>
              </Dialog.Title>
              <button
                type="button"
                onClick={closeAllDrawers}
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
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                      <Skeleton className="h-full w-full rounded-lg" />
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
                  <div className="py-8 text-center">
                    <p className="text-body-subtle">
                      Failed to load product data
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
