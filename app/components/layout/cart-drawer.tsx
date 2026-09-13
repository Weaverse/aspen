import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { type CartReturn, useAnalytics } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { Suspense } from "react";
import { Await, useRouteLoaderData } from "react-router";
import { Cart } from "~/components/cart/cart";
import { useCartState } from "~/components/cart/cart-state-provider";
import { useCartStore } from "~/components/cart/store";
import Link from "~/components/link";
import type { RootLoader } from "~/root";
import { AnimatedDrawer } from "../animate-drawer";

// Event-based cart drawer state management

export function toggleCartDrawer(open: boolean) {
  useCartStore.getState().toggle(open);
}

export function useCartDrawerState() {
  const isOpen = useCartStore((state) => state.isOpen);

  return {
    isOpen,
    closeCartDrawer: () => toggleCartDrawer(false),
    openCartDrawer: () => toggleCartDrawer(true),
    toggleCartDrawer,
  };
}

export function CartDrawer() {
  const { t } = useTranslation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const { cart: latestCart, isResolved } = useCartState();
  const { publish } = useAnalytics();
  const { isOpen, closeCartDrawer } = useCartDrawerState();

  return (
    <Suspense
      fallback={
        <Link
          to="/cart"
          aria-label={t("accessibility.openCart")}
          className="relative flex size-5 items-center justify-center focus:ring-border before:absolute before:-inset-2"
        >
          <ShoppingBagIcon className="size-5" />
        </Link>
      }
    >
      <Await resolve={isResolved ? latestCart : rootData?.cart}>
        {(cart) => (
          <Dialog.Root open={isOpen} onOpenChange={toggleCartDrawer}>
            <Dialog.Trigger
              aria-label={t("accessibility.openCart")}
              onClick={() => publish("custom_sidecart_viewed", { cart })}
              className="relative flex h-5 items-center focus:ring-border before:absolute before:-inset-2"
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                <ShoppingBagIcon className="size-5" />
              </span>
              {cart?.totalQuantity > 0 && (
                <span
                  className="-mt-2 inline-flex h-3 shrink-0 items-center justify-center self-start whitespace-nowrap font-body text-[10px] leading-3"
                  style={{
                    width: `${String(cart.totalQuantity).length * 6}px`,
                  }}
                >
                  {cart.totalQuantity}
                </span>
              )}
            </Dialog.Trigger>
            <AnimatedDrawer open={isOpen} flush>
              {/* Figma 512:13474 — the panel is the padded flex column:
                  padding 12px 20px 24px, align-items flex-start, gap 16px. */}
              <div className="flex h-full min-h-0 flex-col items-start gap-4 px-5 pt-3 pb-6 max-xl:pb-[max(24px,env(safe-area-inset-bottom))]">
                <div className="flex h-[42px] w-full shrink-0 items-center justify-between gap-2">
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
                <Cart layout="drawer" cart={cart as CartReturn} />
              </div>
            </AnimatedDrawer>
          </Dialog.Root>
        )}
      </Await>
    </Suspense>
  );
}
