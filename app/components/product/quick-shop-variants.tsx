import type { MappedProductOptions } from "@shopify/hydrogen";
import { QuickShopOptionValues } from "./quick-shop-option-values";
import type { ProductVariant } from "@shopify/hydrogen/storefront-api-types";

export function QuickShopVariants({
  productOptions,
  onVariantChange,
  adjacentVariants,
}: {
  productOptions: MappedProductOptions[];
  onVariantChange: (variantId: string) => void;
  adjacentVariants: ProductVariant[];
}) {
  // Check if this is a default variant only product
  if (productOptions.length === 1) {
    const option = productOptions[0];
    if (option.name === "Title" && option.optionValues.length === 1) {
      const optionValue = option.optionValues[0];
      if (optionValue.name === "Default Title") {
        return null;
      }
    }
  }

  return (
    <div className="space-y-5" data-motion="fade-up">
      <div className="product-form space-y-7 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
        {productOptions.map((option) => (
          <div className="product-options flex justify-between items-center" key={option.name}>
            <legend className="leading-tight">
              <span className="font-medium uppercase">{option.name}</span>
            </legend>
            <QuickShopOptionValues 
              option={option} 
              onVariantChange={onVariantChange}
              adjacentVariants={adjacentVariants}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 