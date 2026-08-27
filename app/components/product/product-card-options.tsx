import { Image } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import type {
  ProductCardFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { RevealUnderline } from "~/reveal-underline";
import { cn } from "~/utils/cn";
import { isLightColor, isValidColor } from "~/utils/misc";
import { OPTIONS_AS_SWATCH } from "./product-option-values";

export function ProductCardOptions({
  product,
  selectedVariant,
  setSelectedVariant,
  className,
}: {
  product: ProductCardFragment;
  selectedVariant?: ProductVariantFragment | null;
  setSelectedVariant: (variant: ProductVariantFragment | null) => void;
  className?: string;
}) {
  const { pcardShowOptionValues, pcardOptionToShow, pcardMaxOptionValues } =
    useThemeSettings();
  const { t } = useTranslation();
  const { handle, options } = product;
  const option = options.find(
    ({ name }) =>
      name.toLocaleLowerCase() === pcardOptionToShow?.toLocaleLowerCase(),
  );
  const optionValues = option?.optionValues;

  if (!(pcardShowOptionValues && optionValues?.length)) {
    return null;
  }

  const maxOptionValues = Math.max(1, pcardMaxOptionValues || 5);
  const restCount = Math.max(0, optionValues.length - maxOptionValues);

  let selectedValue = "";
  if (selectedVariant) {
    selectedValue = selectedVariant.selectedOptions?.find(
      ({ name }) =>
        name.toLocaleLowerCase() === option.name.toLocaleLowerCase(),
    )?.value;
  }
  const asSwatch = OPTIONS_AS_SWATCH.some(
    (name) => name.toLocaleLowerCase() === option.name.toLocaleLowerCase(),
  );

  return (
    <fieldset className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <legend className="sr-only">
        {t("product.optionsFor", {
          option: option.name,
          product: product.title,
        })}
      </legend>
      {optionValues
        .slice(0, maxOptionValues)
        .map(({ name, swatch, firstSelectableVariant }) => {
          if (asSwatch) {
            const swatchColor = swatch?.color || name;
            const selected = selectedValue === name;
            const unavailable = !firstSelectableVariant?.availableForSale;
            return (
              <Tooltip key={name}>
                <TooltipTrigger>
                  <button
                    type="button"
                    className={cn(
                      "flex size-5 items-center justify-center rounded-xs border p-0.5 transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
                      selected
                        ? "border-line"
                        : "border-line-subtle hover:border-line",
                      unavailable && "diagonal opacity-60",
                    )}
                    aria-label={t("product.selectOptionValue", {
                      option: option.name,
                      value: name,
                    })}
                    aria-pressed={selected}
                    disabled={!firstSelectableVariant}
                    onClick={() => {
                      if (firstSelectableVariant) {
                        setSelectedVariant(firstSelectableVariant);
                      }
                    }}
                  >
                    {swatch?.image?.previewImage ? (
                      <Image
                        data={swatch.image.previewImage}
                        className="h-full w-full rounded-[1px] object-cover object-center"
                        width={16}
                        height={16}
                        sizes="16px"
                        alt=""
                      />
                    ) : (
                      <span
                        className={clsx(
                          "inline-block h-full w-full rounded-[1px] text-[0px]",
                          (!isValidColor(swatchColor) ||
                            isLightColor(swatchColor)) &&
                            "border border-line-subtle",
                          !isValidColor(swatchColor) && "bg-gray-200",
                        )}
                        style={
                          isValidColor(swatchColor)
                            ? { backgroundColor: swatchColor }
                            : undefined
                        }
                      >
                        {name}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{name}</TooltipContent>
              </Tooltip>
            );
          }
          return (
            <Button
              key={name}
              variant="outline"
              animate={false}
              className={clsx(
                "min-h-8 border border-line-subtle px-2 py-1 text-center text-sm transition-colors",
                selectedValue === name &&
                  "border-body bg-body text-body-inverse",
                !firstSelectableVariant?.availableForSale &&
                  "text-body-subtle line-through opacity-60",
              )}
              aria-pressed={selectedValue === name}
              disabled={!firstSelectableVariant}
              onClick={() => {
                if (firstSelectableVariant) {
                  setSelectedVariant(firstSelectableVariant);
                }
              }}
            >
              {name}
            </Button>
          );
        })}
      {restCount > 0 && (
        <Link
          to={`/products/${handle}`}
          className="pl-0.5 text-sm"
          aria-label={t("product.viewAllOptions", {
            option: option.name,
            product: product.title,
          })}
        >
          <RevealUnderline className="ff-heading">+{restCount}</RevealUnderline>
        </Link>
      )}
    </fieldset>
  );
}
