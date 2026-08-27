import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAnalytics } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { Cart } from "~/components/cart/cart";
import { useCart, useCartStore } from "~/components/cart/store";
import { AnimatedDrawer } from "../animate-drawer";

export function toggleCartDrawer(open: boolean) {
  useCartStore.getState().toggle(open);
}

export function useCartDrawerState() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCartDrawer = useCartStore((state) => state.close);
  const openCartDrawer = useCartStore((state) => state.open);

  return {
    isOpen,
    closeCartDrawer,
    openCartDrawer,
    toggleCartDrawer,
  };
}

export function CartDrawer() {
  const { t } = useTranslation();
  const cart = useCart();
  const { publish } = useAnalytics();
  const { isOpen, closeCartDrawer } = useCartDrawerState();

  return (
    <Dialog.Root open={isOpen} onOpenChange={toggleCartDrawer}>
      <Dialog.Trigger
        aria-label={t("accessibility.openCart")}
        onClick={() => publish("custom_sidecart_viewed", { cart })}
        className="relative flex h-5 items-center focus:ring-border before:absolute before:-inset-2"
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <ShoppingBagIcon className="size-5" />
        </span>
        {cart && cart.totalQuantity > 0 && (
          <span
            className="-mt-2 inline-flex h-3 shrink-0 items-center justify-center self-start whitespace-nowrap font-body text-[10px] leading-3"
            style={{ width: `${String(cart.totalQuantity).length * 6}px` }}
          >
            {cart.totalQuantity}
          </span>
        )}
      </Dialog.Trigger>
      <AnimatedDrawer open={isOpen}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-2 px-5 pb-5">
            <Dialog.Title asChild className="text-sm">
              <span className="font-semibold uppercase tracking-[0.02em]">
                {t("cart.title")}
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="translate-x-2 p-2"
                aria-label={t("accessibility.closeCart")}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Cart layout="drawer" />
        </div>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}
