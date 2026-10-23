import { useTranslation } from "@weaverse/hydrogen";
import type { CartLine } from "./cart-types";
import { useCartStore } from "./store";

export function CartLineQuantityAdjust({ line }: { line: CartLine }) {
  const { t } = useTranslation();
  if (!line || typeof line.quantity === "undefined") {
    return null;
  }

  const { id: lineId, quantity } = line;
  const disabled = lineId.startsWith("optimistic-");
  const updateQuantity = (nextQuantity: number) => {
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      return;
    }
    useCartStore.getState().stageLineUpdate(lineId, nextQuantity);
  };

  return (
    <fieldset
      className="inline-flex h-7.5 w-30 shrink-0 items-stretch overflow-hidden rounded-(--radius-sm) bg-(--color-background-subtle) font-dm-sans font-semibold text-[14px] text-body leading-none tracking-[0.02em]"
      aria-label={t("product.quantityValue", { quantity })}
    >
      <button
        type="button"
        className="flex w-11 shrink-0 flex-col items-center justify-center py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed"
        disabled={disabled || quantity <= 1}
        aria-label={t("product.decreaseQuantity")}
        onClick={() => updateQuantity(quantity - 1)}
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
        className="flex w-11 shrink-0 flex-col items-center justify-center py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label={t("product.increaseQuantity")}
        onClick={() => updateQuantity(quantity + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}
