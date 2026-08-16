import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { type CartReturn, useAnalytics } from "@shopify/hydrogen";
import clsx from "clsx";
import { Suspense, useEffect, useState } from "react";
import { Await, useRouteLoaderData } from "react-router";
import { Cart } from "~/components/cart/cart";
import { useCartState } from "~/components/cart/cart-state-provider";
import Link from "~/components/link";
import type { RootLoader } from "~/root";
import { AnimatedDrawer } from "../animate-drawer";

// Event-based cart drawer state management
const CART_DRAWER_EVENT = "cart-drawer-toggle";

export function toggleCartDrawer(open: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CART_DRAWER_EVENT, { detail: { open } }),
    );
  }
}

export function useCartDrawerState() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      setIsOpen(customEvent.detail.open);
    };

    window.addEventListener(CART_DRAWER_EVENT, handler);
    return () => window.removeEventListener(CART_DRAWER_EVENT, handler);
  }, []);

  return {
    isOpen,
    closeCartDrawer: () => toggleCartDrawer(false),
    openCartDrawer: () => toggleCartDrawer(true),
    toggleCartDrawer,
  };
}

export function CartDrawer() {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const { cart: latestCart, isResolved } = useCartState();
  const { publish } = useAnalytics();
  const { isOpen, closeCartDrawer } = useCartDrawerState();

  return (
    <Suspense
      fallback={
        <Link
          to="/cart"
          aria-label="Open cart"
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
              aria-label="Open cart"
              onClick={() => publish("custom_sidecart_viewed", { cart })}
              className="relative flex size-5 items-center justify-center focus:ring-border before:absolute before:-inset-2"
            >
              <ShoppingBagIcon className="size-5" />
              {cart?.totalQuantity > 0 && (
                <div
                  className={clsx(
                    "-right-2 -top-1 absolute",
                    "flex h-5 min-w-5 items-center justify-center",
                    "font-medium text-[11px] leading-none",
                    "px-1 py-0.5",
                  )}
                >
                  <span>{cart?.totalQuantity}</span>
                </div>
              )}
            </Dialog.Trigger>
            <AnimatedDrawer open={isOpen}>
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between gap-2 px-5 pb-5">
                  <Dialog.Title asChild className="text-base">
                    <span className="font-semibold uppercase">Cart</span>
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="translate-x-2 p-2"
                      aria-label="Close cart drawer"
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
