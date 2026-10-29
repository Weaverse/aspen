import { useTranslation } from "@weaverse/hydrogen";
import type { CartLine } from "./cart-types";
import { canAdjustLineQuantity, useCartStore } from "./store";

export function CartLineQuantityAdjust({ line }: { line: CartLine }) {
  const { t } = useTranslation();
  const canIncrease = useCartStore((state) =>
    canAdjustLineQuantity(state, line?.id, 1),
  );
  const canDecrease = useCartStore((state) =>
    canAdjustLineQuantity(state, line?.id, -1),
  );
  const isPending = useCartStore((state) =>
    state.pendingLineUpdates.has(line?.id),
  );
  if (!line || typeof line.quantity === "undefined") {
    return null;
  }

  const { id: lineId, quantity } = line;

  return (
    <fieldset
      className="inline-flex h-7.5 w-30 shrink-0 items-stretch overflow-hidden rounded-(--radius-sm) bg-(--color-background-subtle) font-dm-sans font-semibold text-[14px] text-body leading-none tracking-[0.02em]"
      aria-label={t("product.quantityValue", { quantity })}
      aria-busy={isPending}
    >
      <button
        type="button"
        className="flex w-8 shrink-0 flex-col items-center justify-center py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed"
        disabled={!canDecrease || quantity <= 1}
        aria-label={t("product.decreaseQuantity")}
        onClick={() => useCartStore.getState().adjustLineQuantity(lineId, -1)}
      >
        <span aria-hidden="true">-</span>
      </button>
      <span
        aria-hidden="true"
        className="w-px shrink-0 self-stretch bg-white/20"
      />
      <output
        className="flex min-w-0 flex-1 flex-col items-center justify-center py-2"
        aria-live="polite"
      >
        {quantity}
      </output>
      <span
        aria-hidden="true"
        className="w-px shrink-0 self-stretch bg-white/20"
      />
      <button
        type="button"
        className="flex w-8 shrink-0 flex-col items-center justify-center py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed"
        disabled={!canIncrease}
        title={
          !canIncrease
            ? t(
                isPending
                  ? "cart.updatingQuantity"
                  : "cart.quantityLimitReached",
              )
            : undefined
        }
        aria-label={t("product.increaseQuantity")}
        onClick={() => useCartStore.getState().adjustLineQuantity(lineId, 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}
