import { HandbagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { type CartReturn, useAnalytics } from "@shopify/hydrogen";
import clsx from "clsx";
import { Suspense, useState } from "react";
import { Await, useRouteLoaderData } from "react-router";
import { Cart } from "~/components/cart/cart";
import Link from "~/components/link";
import type { RootLoader } from "~/root";

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
          className="relative flex items-center justify-center w-8 h-8 focus:ring-border"
        >
          <HandbagIcon className="w-5 h-5" />
        </Link>
      }
    >
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              onClick={() => publish("custom_sidecart_viewed", { cart })}
              className="relative flex items-center justify-center w-8 h-8 focus:ring-border"
            >
              <HandbagIcon className="w-5 h-5" />
              {cart?.totalQuantity > 0 && (
                <div
                  className={clsx(
                    "cart-count",
                    "absolute top-0 -right-1.5",
                    "flex items-center text-center justify-center min-w-4.5 h-4.5 px-1 rounded-full",
                    "text-[13px] leading-none text-center font-medium",
                    "transition-colors duration-300",
                    "group-hover/header:bg-(--color-header-text)",
                    "group-hover/header:text-(--color-header-bg)"
                  )}
                >
                  <span className="-mr-px">{cart?.totalQuantity}</span>
                </div>
              )}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
                style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
              />
              <Dialog.Content
                className={clsx([
                  "fixed inset-y-0 right-0 w-screen max-w-[430px] bg-background py-4 z-10",
                  "data-[state=open]:animate-enter-from-right",
                ])}
                aria-describedby={undefined}
              >
                <div className="">
                  <div className="flex gap-2 items-center justify-between px-4">
                    <Dialog.Title asChild className="text-base">
                      <span className="font-bold">Cart</span>
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="p-2 translate-x-2"
                        aria-label="Close cart drawer"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <Cart layout="drawer" cart={cart as CartReturn} />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </Await>
    </Suspense>
  );
}
