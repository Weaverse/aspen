import type { MappedProductOptions } from "@shopify/hydrogen";
import { QuickShopOptionValues } from "./quick-shop-option-values";

export function QuickShopVariants({
  productOptions,
  onVariantChange,
  layout = "select",
}: {
  productOptions: MappedProductOptions[];
  onVariantChange: (variantId: string) => void;
  layout?: "select" | "buttons";
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

  if (layout === "buttons") {
    return (
      <div className="flex flex-col gap-6" data-motion="fade-up">
        {productOptions.map((option) => (
          <fieldset className="product-options min-w-0" key={option.name}>
            <legend className="mb-3 font-semibold uppercase leading-tight tracking-[0.02em]">
              {option.name}
            </legend>
            <QuickShopOptionValues
              option={option}
              onVariantChange={onVariantChange}
              layout="buttons"
            />
          </fieldset>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-motion="fade-up">
      <div className="product-form space-y-7 divide-y divide-line-subtle [&>*:not(:last-child)]:pb-3">
        {productOptions.map((option) => (
          <div
            className="product-options flex items-center justify-between"
            key={option.name}
          >
            <legend className="leading-tight">
              <span className="font-semibold uppercase">{option.name}</span>
            </legend>
            <QuickShopOptionValues
              option={option}
              onVariantChange={onVariantChange}
              layout="select"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
