import { CaretDown } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useId } from "react";
import { getCartMutationError } from "~/utils/cart-error";
import type { CartLayout, CartLine } from "./cart-types";
import { useCartStore } from "./store";

/**
 * Quantity mutations are serialized per cart line. A second interaction updates
 * the optimistic target immediately and is coalesced into the next request
 * instead of being silently discarded while the first request is in flight.
 */
export function CartLineQuantityAdjust({
  line,
  layout,
}: {
  line: CartLine;
  layout: CartLayout;
}) {
  const { t } = useTranslation();
  const pendingQuantity = useCartStore((state) =>
    state.pendingLineUpdates.get(line.id),
  );
  const mutationResponse = useCartStore((state) =>
    state.lineUpdateErrors.get(line.id),
  );
  const quantityId = useId();
  const selectedQuantity = pendingQuantity ?? line.quantity;
  const quantities = Array.from(
    { length: Math.max(10, selectedQuantity) },
    (_, index) => index + 1,
  );
  const mutationError = getCartMutationError(mutationResponse, t);

  if (!line.id || typeof line.quantity === "undefined") {
    return null;
  }

  return (
    <div>
      <label htmlFor={quantityId} className="sr-only">
        {t("product.quantityValue", { quantity: selectedQuantity })}
      </label>
      <div className="quantity-selector relative">
        <Select.Root
          value={String(selectedQuantity)}
          onValueChange={(value) => {
            const nextQuantity = Number(value);
            if (
              !Number.isInteger(nextQuantity) ||
              nextQuantity < 1 ||
              nextQuantity === selectedQuantity
            ) {
              return;
            }
            useCartStore.getState().stageLineUpdate(line.id, nextQuantity);
          }}
          disabled={Boolean(
            line.isOptimistic && line.id.startsWith("optimistic-"),
          )}
        >
          <Select.Trigger
            id={quantityId}
            className="inline-flex min-w-[80px] items-center justify-between gap-2 bg-white outline-hidden"
            aria-label={t("product.selectQuantity")}
          >
            <span className={clsx(layout === "page" && "font-medium text-sm")}>
              {t("product.quantityShort")}
            </span>
            <span
              className={clsx(
                "flex-1 text-center",
                layout === "page" && "text-sm",
              )}
            >
              <Select.Value />
            </span>
            <Select.Icon className="shrink-0">
              <CaretDown className={clsx(layout === "page" && "h-3 w-3")} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
              <Select.Viewport className="p-1">
                {quantities.map((quantity) => (
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
      {mutationError && (
        <p className="mt-2 text-red-700 text-xs" role="alert">
          {mutationError}
        </p>
      )}
    </div>
  );
}
