import { ShoppingBagIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAnalytics } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { Cart } from "~/components/cart/cart";
import { useCart, useCartStore } from "~/components/cart/store";
import { AnimatedDrawer } from "../animate-drawer";
import { DrawerPanel } from "./drawer-panel";
import { NavbarCount } from "./navbar-count";

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
        <NavbarCount count={cart?.totalQuantity ?? 0} />
      </Dialog.Trigger>
      <AnimatedDrawer open={isOpen} flush>
        <DrawerPanel
          title={t("cart.title")}
          closeLabel={t("accessibility.closeCart")}
        >
          <Cart layout="drawer" onClose={closeCartDrawer} />
        </DrawerPanel>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}
