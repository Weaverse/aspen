import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";
import { Image, type MappedProductOptions } from "@shopify/hydrogen";
import { useNavigate } from "react-router";
import type { ProductVariantFragment } from "storefront-api.generated";
import { cn } from "~/utils/cn";
import { isLightColor, isValidColor } from "~/utils/misc";

/*
 * Configure which options should show color swatches beside the dropdown
 */
const OPTIONS_WITH_SWATCH = ["Color", "Colors", "Colour", "Colours"];
const OPTIONS_WITH_IMAGE = ["Style", "Pattern", "Material"];

// Export for backward compatibility with product-card-options.tsx
export const OPTIONS_AS_SWATCH = OPTIONS_WITH_SWATCH;

export function ProductOptionValues({
  option,
  onVariantChange,
  combinedListing,
}: {
  option: MappedProductOptions;
  onVariantChange?: (variant: ProductVariantFragment) => void;
  combinedListing?: boolean;
}) {
  const navigate = useNavigate();
  const { name: optionName, optionValues } = option || {};

  if (!optionName) {
    return null;
  }

  const selectedValue = optionValues.find((v) => v.selected)?.name;
  const selectedOption = optionValues.find((v) => v.selected);
  const showSwatch = OPTIONS_WITH_SWATCH.includes(optionName);
  const showImage = OPTIONS_WITH_IMAGE.includes(optionName);

  return (
    <div className="flex items-center gap-3">
      {/* Color swatch or image preview */}
      {(showSwatch || showImage) && selectedOption && (
        <div className="w-3 h-3 overflow-hidden flex-shrink-0">
          {showSwatch && selectedOption.swatch?.image?.previewImage ? (
            <Image
              data={selectedOption.swatch.image.previewImage}
              className="w-3 h-3 object-cover object-center"
              width={12}
              height={12}
              sizes="12px"
            />
          ) : showSwatch && selectedOption.swatch?.color ? (
            <div
              className={cn(
                "w-3 h-3",
                (!isValidColor(selectedOption.swatch.color) || 
                 isLightColor(selectedOption.swatch.color)) &&
                "border border-line-subtle"
              )}
              style={{ backgroundColor: selectedOption.swatch.color }}
            />
          ) : showSwatch ? (
            <div
              className={cn(
                "w-3 h-3",
                (!isValidColor(selectedOption.name) || 
                 isLightColor(selectedOption.name)) &&
                "border border-line-subtle"
              )}
              style={{ backgroundColor: selectedOption.name }}
            />
          ) : showImage && selectedOption.firstSelectableVariant?.image ? (
            <Image
              data={selectedOption.firstSelectableVariant.image}
              className="w-3 h-3 object-cover object-center"
              width={12}
              height={12}
              sizes="12px"
            />
          ) : (
            <div className="w-3 h-3 bg-gray-200" />
          )}
        </div>
      )}

      {/* Dropdown for ALL options */}
      <Select.Root
        value={selectedValue}
        onValueChange={(v) => {
          const found = optionValues.find(({ name: value }) => value === v);
          if (found) {
            if (onVariantChange && found.firstSelectableVariant) {
              onVariantChange(found.firstSelectableVariant);
            } else {
              const to = found.isDifferentProduct
                ? `/products/${found.handle}?${found.variantUriQuery}`
                : `?${found.variantUriQuery}`;
              // Use client-side navigation to avoid full page reloads
              // Honor combinedListing semantics: do not replace history when switching products if combined listing
              if (found.isDifferentProduct) {
                navigate(to, { replace: !combinedListing });
              } else {
                navigate(to, { replace: true });
              }
            }
          }
        }}
      >
        <Select.Trigger
          className="flex-1 inline-flex items-center justify-between gap-2 bg-white outline-hidden rounded"
          aria-label={optionName}
        >
          <Select.Value placeholder={`Select ${optionName}`} />
          <Select.Icon className="shrink-0">
            <CaretDownIcon size={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white rounded shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] z-50">
            <Select.ScrollUpButton className="cursor-pointer flex items-center justify-center hover:bg-gray-100 h-6">
              <CaretUpIcon size={16} />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-1">
              {optionValues.map(({ name: value, selected, available, swatch, firstSelectableVariant }) => (
                <Select.Item
                  key={value}
                  value={value}
                  className={cn(
                    "flex gap-3 cursor-pointer w-full items-center hover:bg-gray-100 outline-hidden h-10 select-none px-3 py-2 rounded",
                    !available && "text-body-subtle line-through opacity-50",
                  )}
                >
                  {/* Swatch/Image in dropdown item */}
                  {(showSwatch || showImage) && (
                    <div className="w-3 h-3 overflow-hidden flex-shrink-0">
                      {showSwatch && swatch?.image?.previewImage ? (
                        <Image
                          data={swatch.image.previewImage}
                          className="w-full h-full object-cover object-center"
                          width={12}
                          height={12}
                          sizes="12px"
                        />
                      ) : showSwatch && swatch?.color ? (
                        <div
                          className={cn(
                            "w-full h-full",
                            (!isValidColor(swatch.color) || isLightColor(swatch.color)) &&
                            "border border-line-subtle"
                          )}
                          style={{ backgroundColor: swatch.color }}
                        />
                      ) : showSwatch ? (
                        <div
                          className={cn(
                            "w-full h-full",
                            (!isValidColor(value) || isLightColor(value)) &&
                            "border border-line-subtle"
                          )}
                          style={{ backgroundColor: value }}
                        />
                      ) : showImage && firstSelectableVariant?.image ? (
                        <Image
                          data={firstSelectableVariant.image}
                          className="w-full h-full object-cover object-center"
                          width={12}
                          height={12}
                          sizes="12px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                  )}
                  
                  <Select.ItemText className="flex-1">{value}</Select.ItemText>
                  
                  {selected && (
                    <Select.ItemIndicator className="inline-flex w-5 shrink-0 items-center justify-center">
                      <CheckIcon size={16} />
                    </Select.ItemIndicator>
                  )}
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="cursor-pointer flex items-center justify-center hover:bg-gray-100 h-6">
              <CaretDownIcon size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
