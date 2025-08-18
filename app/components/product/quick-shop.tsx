import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  ShopPayButton,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { XIcon, CaretLeftIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useFetcher, Link } from "react-router";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductMedia } from "~/components/product/product-media";
import { QuickShopVariants } from "~/components/product/quick-shop-variants";
import { Quantity } from "~/components/product/quantity";
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
        <div key={title} className="flex flex-col items-center gap-6 w-full">
          <span className="font-normal uppercase w-full">
            {title}
          </span>
          <div
            suppressHydrationWarning
            className="font-normal w-full prose prose-sm prose-neutral max-w-none [&>p]:mb-4 [&>ul]:mb-4 [&>ol]:mb-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {learnMore && (
            <Link
              className="pb-px border-b border-line-subtle text-body-subtle text-sm w-full"
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
          className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-20"
          style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 w-full md:max-w-[430px] bg-background py-2.5 z-20",
            "right-0 data-[state=open]:animate-enter-from-right shadow-2xl",
          ])}
          aria-describedby={undefined}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center w-4 h-4"
                >
                  <CaretLeftIcon className="w-4 h-4 text-[#29231E]" />
                </button>
                <Dialog.Title asChild>
                  <span className="font-semibold uppercase">DESCRIPTION</span>
                </Dialog.Title>
              </div>
              <button
                type="button"
                onClick={onCloseAll || (() => onOpenChange(false))}
                className="flex items-center justify-center w-4 h-4"
              >
                <XIcon className="w-4 h-4 text-[#29231E]" />
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
  onCloseAll 
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
      <div className="space-y-6" style={{ "--shop-pay-button-height": "48px" } as React.CSSProperties}>
        {/* Product Image */}
        <div className="aspect-square w-full overflow-hidden relative bg-gray-100 rounded-lg">
          <div className="absolute inset-0 [&_.swiper]:!h-full [&_.swiper-slide]:!h-full [&_.swiper-wrapper]:!h-full">
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
          <h4 className="font-medium leading-tight line-clamp-2">{title}</h4>
          <button
            type="button"
            className="underline cursor-pointer"
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
              className="w-full h-12"
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
                className="w-full h-12"
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
  const {
    quickShopButtonTextOpen,
  } = useThemeSettings();
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
        if (!isOpen) {
          closeAllDrawers();
        } else {
          setOpen(isOpen);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            // Mobile/Tablet: Always visible circular button at bottom right
            "absolute bottom-4 right-4 w-12 h-12 md:opacity-100",
            "bg-white rounded-full",
            "flex items-center justify-center p-0",
            // Desktop: Hide initially, show on hover with text
            showOnHover ? "lg:opacity-0 lg:inset-x-4 lg:w-auto lg:h-auto lg:rounded-none" : "lg:opacity-100 lg:inset-x-4 lg:w-auto lg:h-auto lg:rounded-none",
            "lg:px-6 lg:py-3",
            "lg:text-(--btn-secondary-text) lg:bg-(--btn-secondary-bg) lg:border-(--btn-secondary-bg)",
            showOnHover ? "lg:-translate-y-1.5 lg:-translate-x-2 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 lg:group-hover:translate-y-2" : "",
            "lg:font-normal lg:whitespace-nowrap",
          )}
        >
          {/* Shopping bag icon for mobile/tablet */}
          <svg 
            className="w-5 h-5 text-[#29231E] lg:hidden" 
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
          <span className="hidden lg:inline uppercase">{buttonText || quickShopButtonTextOpen}</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
          style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 w-full md:max-w-[430px] bg-background py-2.5 z-10",
            "right-0 data-[state=open]:animate-enter-from-right shadow-2xl",
          ])}
          aria-describedby={undefined}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 flex-shrink-0 py-3">
              <Dialog.Title asChild>
                <span className="font-semibold uppercase">Quick Shop</span>
              </Dialog.Title>
              <button
                type="button"
                onClick={closeAllDrawers}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1" size="sm">
              <div className="px-5 py-4">
                {state === "loading" ? (
                  <div className="space-y-6">
                    {/* Image skeleton */}
                    <div className="aspect-square w-full overflow-hidden relative bg-gray-100 rounded-lg">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>

                    {/* Content skeleton */}
                    <div className="space-y-6">
                      {/* Title & Price */}
                      <div className="space-y-3">
                        <Skeleton className="w-3/4 h-7" />
                        <Skeleton className="w-1/3 h-6" />
                      </div>

                      {/* Variants */}
                      <div className="space-y-3">
                        <Skeleton className="w-1/4 h-5" />
                        <div className="flex gap-2">
                          <Skeleton className="w-12 h-10" />
                          <Skeleton className="w-12 h-10" />
                          <Skeleton className="w-12 h-10" />
                        </div>
                      </div>

                      {/* Quantity & Buttons */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-16 h-5" />
                          <Skeleton className="w-24 h-10" />
                        </div>
                        <Skeleton className="w-full h-12" />
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
                  <div className="text-center py-8">
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
