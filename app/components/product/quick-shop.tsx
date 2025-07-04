import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  ShopPayButton,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import type { ProductVariant } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Modal, ModalContent, ModalTrigger } from "~/components/modal";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { Skeleton } from "~/components/skeleton";
import { VariantPrices } from "~/components/variant-prices";
import type { ProductData } from "~/routes/($locale).api.product";

interface QuickViewData {
  product: NonNullable<ProductQuery["product"]>;
  storeDomain: string;
}

export function QuickShop({ data }: { data: QuickViewData }) {
  const themeSettings = useThemeSettings();
  const { product, storeDomain } = data || {};

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

  const [quantity, setQuantity] = useState<number>(1);
  const {
    addToCartText,
    soldOutText,
    unavailableText,
    hideUnavailableOptions,
    productQuickViewImageAspectRatio,
  } = themeSettings;

  // // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  // useEffect(() => {
  //   if (variants?.nodes?.length) {
  //     if (!selectedVariant) {
  //       setSelectedVariant(variants?.nodes?.[0]);
  //     } else if (selectedVariant?.id !== product?.selectedVariant?.id) {
  //       setSelectedVariant(product?.selectedVariant);
  //     }
  //   }
  // }, [product?.id]);

  const { title, summary } = product;
  const atcText = selectedVariant?.availableForSale
    ? addToCartText
    : selectedVariant?.quantityAvailable === -1
      ? unavailableText
      : soldOutText;
  return (
    <div className="bg-background">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <ProductMedia
          mediaLayout="slider"
          media={product?.media.nodes}
          selectedVariant={selectedVariant}
          showThumbnails={false}
          imageAspectRatio={productQuickViewImageAspectRatio}
        />
        <div className="flex flex-col justify-start space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h5>{title}</h5>
            </div>
            <VariantPrices variant={selectedVariant as ProductVariant} />
            {/* <ProductVariants
              product={product}
              options={product?.options}
              productHandle={product?.handle}
              selectedVariant={selectedVariant}
              onSelectedVariantChange={handleSelectedVariantChange}
              variants={
                _variants.product?.variants as {
                  nodes: ProductVariantFragment[];
                }
              }
              hideUnavailableOptions={hideUnavailableOptions}
            /> */}
          </div>
          <Quantity value={quantity} onChange={setQuantity} />
          {/* TODO: fix quick-shop modal & cart drawer overlap each other */}
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
            className="w-full"
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
          <p className="leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
}

export function QuickShopTrigger({ productHandle }: { productHandle: string }) {
  const [open, setOpen] = useState(false);
  const { load, data, state } = useFetcher<ProductData>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: open and state are intentionally excluded
  useEffect(() => {
    if (open && !data && state !== "loading") {
      load(`/api/product?handle=${productHandle}`);
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger>
        <Button
          variant="secondary"
          loading={state === "loading"}
          className="absolute inset-x-4 bottom-4 !opacity-0 -translate-y-1.5 -translate-x-2 lg:group-hover:!opacity-100 lg:group-hover:translate-x-0 lg:group-hover:translate-y-2 transition-all duration-500"
        >
          Quick shop
        </Button>
      </ModalTrigger>
      <ModalContent className="min-h-[700px]">
        {state === "loading" ? (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 min-h-[inherit]">
            <Skeleton className="min-h-[inherit]" />
            <div className="space-y-3">
              <Skeleton className="w-2/3 h-12" />
              <Skeleton className="w-1/3 h-6" />
              <Skeleton className="w-1/2 h-10" />
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-full h-6" />
            </div>
          </div>
        ) : (
          <QuickShop data={data as QuickViewData} />
        )}
      </ModalContent>
    </Modal>
  );
}
