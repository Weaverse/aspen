import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  Money,
  ShopPayButton,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { XIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Accordion from "@radix-ui/react-accordion";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useFetcher, Link } from "react-router";
import { Button } from "~/components/button";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductMedia } from "~/components/product/product-media";
import { QuickShopVariants } from "~/components/product/quick-shop-variants";
import { Quantity } from "~/components/product/quantity";
import { ScrollArea } from "~/components/scroll-area";
import { Skeleton } from "~/components/skeleton";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { ProductData } from "~/routes/($locale).api.product";
import { isDiscounted } from "~/utils/product";
import { CompareAtPrice } from "../compare-at-price";

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
    { title: "Description", content: description },
    { title: "Summary", content: summary },
    showShippingPolicy &&
      shippingPolicy?.body && {
        title: "Shipping",
        content: getExcerpt(shippingPolicy.body),
        learnMore: `/policies/${shippingPolicy.handle}`,
      },
    showRefundPolicy &&
      refundPolicy?.body && {
        title: "Returns",
        content: getExcerpt(refundPolicy.body),
        learnMore: `/policies/${refundPolicy.handle}`,
      },
  ].filter(Boolean);

  return (
    <Accordion.Root type="multiple">
      {details.map(({ title, content, learnMore }) => (
        <Accordion.Item key={title} value={title}>
          <Accordion.Trigger
            className={clsx([
              "flex justify-between py-4 w-full font-bold",
              "border-b border-line-subtle",
              "data-[state=open]:[&>.minus]:inline-block",
              "data-[state=open]:[&>.plus]:hidden",
            ])}
          >
            <span>{title}</span>
            <MinusIcon className="w-4 h-4 minus hidden" />
            <PlusIcon className="w-4 h-4 plus" />
          </Accordion.Trigger>
          <Accordion.Content
            style={
              {
                "--expand-to": "var(--radix-accordion-content-height)",
                "--expand-duration": "0.15s",
                "--collapse-from": "var(--radix-accordion-content-height)",
                "--collapse-duration": "0.15s",
              } as React.CSSProperties
            }
            className={clsx([
              "overflow-hidden",
              "data-[state=closed]:animate-collapse",
              "data-[state=open]:animate-expand",
            ])}
          >
            <div
              suppressHydrationWarning
              className="prose dark:prose-invert py-2.5"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            {learnMore && (
              <Link
                className="pb-px border-b border-line-subtle text-body-subtle"
                to={learnMore}
              >
                Learn more
              </Link>
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

// Product Description Drawer Component
function ProductDescriptionDrawer({
  data,
  open,
  onOpenChange,
}: {
  data: ProductData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
            "fixed inset-y-0 w-full md:max-w-[430px] bg-background py-6 z-20",
            "right-0 data-[state=open]:animate-enter-from-right shadow-2xl",
          ])}
          aria-describedby={undefined}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 flex-shrink-0">
              <Dialog.Title asChild>
                <span className="font-semibold">Details</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <XIcon className="w-5 h-5 cursor-pointer" />
              </Dialog.Close>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1" size="sm">
              <div className="px-6 py-4">
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

export function QuickShop({ data }: { data: ProductData }) {
  const themeSettings = useThemeSettings();
  const { product, storeDomain } = data || {};
  const [showDescription, setShowDescription] = useState(false);

  // Internal variant state for QuickShop - not tied to URL
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.selectedOrFirstAvailableVariant?.id || null
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
      <div className="space-y-6">
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
          <h4 className="text-lg font-semibold leading-tight">{title}</h4>
          <Button variant="underline" onClick={() => setShowDescription(true)}>
            View Description
          </Button>
          <div className="space-y-7 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
            {selectedVariant && (
              <div className="flex justify-between">
                <span className="font-normal uppercase">Price</span>
                <div className={"flex gap-2"}>
                  <Money withoutTrailingZeros data={price} />
                  {showCompareAtPrice &&
                    isDiscounted(
                      price as MoneyV2,
                      compareAtPrice as MoneyV2
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
          open={showDescription}
          onOpenChange={setShowDescription}
        />
      )}
    </>
  );
}

export function QuickShopTrigger({ productHandle }: { productHandle: string }) {
  const [open, setOpen] = useState(false);
  const { load, data, state } = useFetcher<ProductData>();
  const apiPath = usePrefixPathWithLocale(
    `/api/product?handle=${productHandle}`
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: open and state are intentionally excluded
  useEffect(() => {
    if (open && !data && state !== "loading") {
      load(apiPath);
    }
  }, [open, apiPath]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="secondary"
          loading={state === "loading"}
          className="!absolute inset-x-4 bottom-4 !opacity-0 -translate-y-1.5 -translate-x-2 lg:group-hover:!opacity-100 lg:group-hover:translate-x-0 lg:group-hover:translate-y-2 !transition-all duration-500"
        >
          Quick shop
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
          style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 w-full md:max-w-[430px] bg-background py-6 z-10",
            "right-0 data-[state=open]:animate-enter-from-right shadow-2xl",
          ])}
          aria-describedby={undefined}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 flex-shrink-0">
              <Dialog.Title asChild>
                <span className="font-semibold">Quick Shop</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <XIcon className="w-5 h-5 cursor-pointer" />
              </Dialog.Close>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1" size="sm">
              <div className="px-6 py-4">
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
                  <QuickShop data={data as ProductData} />
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
