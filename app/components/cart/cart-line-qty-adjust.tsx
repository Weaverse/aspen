import { CaretDown } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useId, useState } from "react";
import type { CartLayout, CartLine } from "./cart-types";
import { useCartStore } from "./store";

export function CartLineQuantityAdjust({
  line,
  layout,
}: {
  line: CartLine;
  layout: CartLayout;
}) {
  const { t } = useTranslation();
  const { id: lineId, isOptimistic } = line || {};
  const quantityId = useId();

  const optimisticQuantity = line?.quantity ?? 1;
  const quantities = Array.from(
    { length: Math.max(10, optimisticQuantity) },
    (_, index) => index + 1,
  );
  const [selectedQty, setSelectedQty] = useState<number>(optimisticQuantity);

  useEffect(() => {
    setSelectedQty(optimisticQuantity);
  }, [optimisticQuantity]);

  // Early return after hooks
  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  // Ensure the select shows the actual quantity even if it's outside default options
  const optionValues = Array.from(
    new Set<number>([...quantities, optimisticQuantity, selectedQty]),
  ).sort((a, b) => a - b);

  const disabled = lineId.startsWith("optimistic-");
  const desktopStepper = (() => {
    if (layout !== "drawer") {
      return null;
    }
    const updateQuantity = (nextQuantity: number) => {
      if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        return;
      }
      useCartStore.getState().stageLineUpdate(lineId, nextQuantity);
    };

    return (
      <fieldset
        className="hidden h-[30px] items-center rounded-lg bg-(--color-background-subtle) xl:inline-flex"
        aria-label={t("product.quantityValue", {
          quantity: optimisticQuantity,
        })}
      >
        <button
          type="button"
          className="flex h-full w-11 items-center justify-center disabled:opacity-40"
          disabled={disabled || optimisticQuantity <= 1}
          aria-label={t("product.decreaseQuantity")}
          onClick={() => updateQuantity(optimisticQuantity - 1)}
        >
          <span
            aria-hidden="true"
            className="font-semibold text-sm leading-none"
          >
            -
          </span>
        </button>
        <span className="flex h-full w-[30px] items-center justify-center border-white/20 border-x font-semibold text-sm">
          {optimisticQuantity}
        </span>
        <button
          type="button"
          className="flex h-full w-11 items-center justify-center disabled:opacity-40"
          disabled={disabled}
          aria-label={t("product.increaseQuantity")}
          onClick={() => updateQuantity(optimisticQuantity + 1)}
        >
          <span
            aria-hidden="true"
            className="font-semibold text-sm leading-none"
          >
            +
          </span>
        </button>
      </fieldset>
    );
  })();

  return (
    <>
      {desktopStepper}
      <label htmlFor={quantityId} className="sr-only">
        {t("product.quantityValue", { quantity: optimisticQuantity })}
      </label>
      <div
        className={clsx(
          "quantity-selector relative",
          layout === "drawer" && "xl:hidden",
        )}
      >
        <Select.Root
          value={String(selectedQty)}
          onValueChange={(value) => {
            const nextQuantity = Number(value);
            if (
              !Number.isInteger(nextQuantity) ||
              nextQuantity < 1 ||
              nextQuantity === optimisticQuantity
            ) {
              return;
            }

            setSelectedQty(nextQuantity);
            useCartStore.getState().stageLineUpdate(lineId, nextQuantity);
          }}
          disabled={disabled}
        >
          <Select.Trigger
            id={quantityId}
            className={clsx(
              "inline-flex min-w-[80px] items-center justify-between gap-2 bg-white outline-hidden",
              layout === "drawer" && "min-h-8 min-w-20 focus-visible:outline-2",
            )}
            aria-label={t("product.selectQuantity")}
          >
            <span
              className={clsx(layout === "page" ? "font-medium text-sm" : "")}
            >
              {t("product.quantityShort")}
            </span>
            <span
              className={clsx(
                "flex-1 text-center",
                layout === "page" ? "text-sm" : "",
              )}
            >
              <Select.Value />
            </span>
            <Select.Icon className="shrink-0">
              <CaretDown className="h-3 w-3" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
              <Select.Viewport className="p-1">
                {optionValues.map((quantity) => (
                  <Select.Item
                    key={quantity}
                    value={String(quantity)}
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
    </>
  );
}
