import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
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
  selectedVariant: ProductVariantFragment;
  setSelectedVariant: (variant: ProductVariantFragment) => void;
  className?: string;
}) {
  const { pcardShowOptionValues, pcardOptionToShow, pcardMaxOptionValues } =
    useThemeSettings();
  const { handle, options } = product;
  const { optionValues } =
    options.find(({ name }) => name === pcardOptionToShow) || {};
  const restCount = optionValues?.length - pcardMaxOptionValues;

  if (!(pcardShowOptionValues && optionValues?.length)) {
    return null;
  }

  let selectedValue = "";
  if (selectedVariant) {
    selectedValue = selectedVariant.selectedOptions?.find(
      ({ name }) => name === pcardOptionToShow,
    )?.value;
  }
  const asSwatch = OPTIONS_AS_SWATCH.includes(pcardOptionToShow);

  return (
    <div className={cn("flex flex-wrap items-center gap-1 px-1", className)}>
      {optionValues
        .slice(0, pcardMaxOptionValues)
        .map(({ name, swatch, firstSelectableVariant }) => {
          if (asSwatch) {
            const swatchColor = swatch?.color || name;
            return (
              <Tooltip key={name}>
                <TooltipTrigger>
                  <button
                    type="button"
                    className={cn(
                      "flex aspect-square size-3",
                      "outline-1 outline-solid",
                      selectedValue === name
                        ? "outline-[#A79D95]"
                        : "outline-[#DBD7D1] hover:outline-[#A79D95]",
                    )}
                    onClick={() => {
                      setSelectedVariant(firstSelectableVariant);
                    }}
                  >
                    {swatch?.image?.previewImage ? (
                      <Image
                        data={swatch.image.previewImage}
                        className="h-full w-full object-cover object-center"
                        width={200}
                        sizes="auto"
                      />
                    ) : (
                      <span
                        className={clsx(
                          "inline-block h-full w-full text-[0px]",
                          // (!isValidColor(swatchColor) ||
                          //   isLightColor(swatchColor)) &&
                          //   "border border-line-subtle",
                        )}
                        style={{ backgroundColor: swatchColor }}
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
                "border border-line-subtle px-2 py-1 text-center text-sm transition-colors",
                selectedValue === name &&
                  "border-body bg-body text-body-inverse",
              )}
              onClick={() => {
                setSelectedVariant(firstSelectableVariant);
              }}
            >
              {name}
            </Button>
          );
        })}
      {restCount > 0 && (
        <Link to={`/products/${handle}`} className="mt-1 pl-0.5">
          <RevealUnderline className="ff-heading">+{restCount}</RevealUnderline>
        </Link>
      )}
    </div>
  );
}
