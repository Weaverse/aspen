import type { MappedProductOptions } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { useNavigate } from "react-router";
import type { ProductVariantFragment } from "storefront-api.generated";
import { SwatchFill, swatchFrameClassName } from "~/components/product/swatch";
import { cn } from "~/utils/cn";
import { hasOnlyDefaultVariant } from "~/utils/product";

const COLOR_OPTION_NAMES = new Set(["color", "colors", "colour", "colours"]);

export function ProductVariants({
  productOptions,
  selectedVariant,
  combinedListing,
  onVariantChange,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductVariantFragment;
  combinedListing?: boolean;
  onVariantChange?: (variant: ProductVariantFragment) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (hasOnlyDefaultVariant(productOptions)) {
    return null;
  }

  const selectedOptions = selectedVariant?.selectedOptions || [];

  return (
    <div className="space-y-6" data-motion="fade-up">
      <div className="product-form space-y-7">
        {productOptions.map((option) => {
          const { name } = option;
          const selected = selectedOptions.find((opt) => opt.name === name);
          const isColorOption = COLOR_OPTION_NAMES.has(name.toLowerCase());

          function selectOption(value: (typeof option.optionValues)[number]) {
            if (!value.firstSelectableVariant) {
              return;
            }

            if (onVariantChange && !value.isDifferentProduct) {
              onVariantChange(value.firstSelectableVariant);
              return;
            }

            const to = value.isDifferentProduct
              ? `/products/${value.handle}?${value.variantUriQuery}`
              : `?${value.variantUriQuery}`;
            navigate(to, {
              replace: value.isDifferentProduct ? !combinedListing : true,
              preventScrollReset: true,
            });
          }

          return (
            <fieldset className="product-options space-y-3" key={name}>
              <legend className="font-semibold text-sm uppercase leading-tight">
                {name}
                {!isColorOption && selected?.value && (
                  <span className="sr-only">: {selected.value}</span>
                )}
              </legend>
              <div className="flex flex-wrap gap-3">
                {option.optionValues.map((value) => {
                  const isSelected = value.selected;
                  const isAvailable = Boolean(
                    value.available && value.firstSelectableVariant,
                  );

                  if (isColorOption) {
                    const swatchColor = value.swatch?.color || value.name;
                    const swatchImage = value.swatch?.image?.previewImage;
                    return (
                      <button
                        key={value.name}
                        type="button"
                        className={cn(
                          swatchFrameClassName("large", isSelected),
                          !isAvailable && "cursor-not-allowed opacity-40",
                        )}
                        onClick={() => selectOption(value)}
                        disabled={!isAvailable}
                        aria-label={t("product.selectOptionValue", {
                          option: name,
                          value: value.name,
                        })}
                        aria-pressed={isSelected}
                      >
                        <SwatchFill
                          size="large"
                          color={swatchColor}
                          image={swatchImage}
                        />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={value.name}
                      type="button"
                      className={cn(
                        "min-h-11 rounded-xl border px-4 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-body"
                          : "border-line-subtle hover:border-line",
                        !isAvailable &&
                          "cursor-not-allowed text-body-subtle line-through opacity-50",
                      )}
                      onClick={() => selectOption(value)}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                    >
                      {value.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
