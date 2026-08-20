import { CaretDownIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";
import { useTranslation } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  maxQuantity?: number; // Optional max quantity limit
  variant?: "select" | "stepper";
  className?: string;
}

export function Quantity(props: QuantityProps) {
  const { t } = useTranslation();
  const {
    value,
    onChange,
    maxQuantity = 10,
    variant = "select",
    className,
  } = props;

  if (variant === "stepper") {
    return (
      <fieldset
        className={cn(
          "grid h-[54px] min-w-32 grid-cols-3 overflow-hidden rounded-lg bg-[#f0efed]",
          className,
        )}
        data-motion="fade-up"
      >
        <legend className="sr-only">{t("product.quantity")}</legend>
        <button
          type="button"
          className="flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label={t("product.decreaseQuantity")}
        >
          <MinusIcon aria-hidden="true" className="h-4 w-4" />
        </button>
        <output
          className="flex items-center justify-center border-line-subtle border-x"
          aria-live="polite"
          aria-label={t(
            value === 1 ? "product.itemCount" : "product.itemCount_other",
            { count: value },
          )}
        >
          {value}
        </output>
        <button
          type="button"
          className="flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onChange(Math.min(maxQuantity, value + 1))}
          disabled={value >= maxQuantity}
          aria-label={t("product.increaseQuantity")}
        >
          <PlusIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      </fieldset>
    );
  }

  // Generate options for the select dropdown
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "flex items-center justify-between border-line-subtle border-b pb-3",
        className,
      )}
      data-motion="fade-up"
    >
      <legend className="font-semibold uppercase leading-tight">
        {t("product.quantityShort")}
      </legend>
      <div className="w-fit">
        <Select.Root
          value={value.toString()}
          onValueChange={(v) => onChange(Number(v))}
        >
          <Select.Trigger
            className="inline-flex min-w-[60px] items-center justify-between gap-2 bg-white px-3 py-2 outline-hidden"
            aria-label={t("product.selectQuantity")}
          >
            <Select.Value />
            <Select.Icon className="shrink-0">
              <CaretDownIcon size={12} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
              <Select.Viewport className="p-1">
                {quantityOptions.map((quantity) => (
                  <Select.Item
                    key={quantity}
                    value={quantity.toString()}
                    className="flex h-8 w-full cursor-pointer select-none items-center justify-center rounded px-3 py-1 outline-hidden hover:bg-gray-100"
                  >
                    <Select.ItemText>{quantity}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  );
}
