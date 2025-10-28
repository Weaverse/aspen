import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { type CartReturn, useAnalytics } from "@shopify/hydrogen";
import clsx from "clsx";
import { Suspense, useState } from "react";
import { Await, useRouteLoaderData } from "react-router";
import { Cart } from "~/components/cart/cart";
import Link from "~/components/link";
import type { RootLoader } from "~/root";
import { AnimatedDrawer } from "../Animate-Drawer";

export let toggleCartDrawer = (_open: boolean) => {};

export function CartDrawer() {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const { publish } = useAnalytics();
  const [open, setOpen] = useState(false);
  toggleCartDrawer = setOpen;

  return (
    <Suspense
      fallback={
        <Link
          to="/cart"
          className="relative flex h-8 w-8 items-center justify-center focus:ring-border"
        >
          <ShoppingBagIcon className="h-5 w-5" />
        </Link>
      }
    >
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              onClick={() => publish("custom_sidecart_viewed", { cart })}
              className="relative flex h-8 w-8 items-center justify-center focus:ring-border"
            >
              <ShoppingBagIcon className="h-5 w-5" />
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
            <AnimatedDrawer open={open}>
              <div className="flex h-full flex-col space-y-6">
                <div className="flex items-center justify-between gap-2 px-4">
                  <Dialog.Title asChild className="text-base">
                    <span className="font-bold">Cart</span>
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
