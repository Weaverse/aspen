import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
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
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleCart = (newOpen: boolean) => {
    if (newOpen) {
      setOpen(true);
      setIsAnimating(false);
    } else {
      // Bắt đầu animation đóng
      setIsAnimating(true);
      // Delay để animation hoàn thành trước khi đóng
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  toggleCartDrawer = toggleCart;

  const handleOpenChange = (newOpen: boolean) => {
    toggleCart(newOpen);
  };

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
          <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
            <Dialog.Portal>
              <Dialog.Overlay
                className={clsx(
                  "fixed inset-0 z-10 bg-black/50 transition-opacity duration-300",
                  open && !isAnimating ? "opacity-100" : "opacity-0",
                )}
              />
              <Dialog.Content
                className={clsx([
                  "fixed inset-y-0 right-0 z-10 w-screen max-w-[430px] bg-background py-4",
                  "transition-transform duration-300 ease-in-out",
                  "data-[state=open]:animate-enter-from-right",
                  open && !isAnimating ? "translate-x-0" : "translate-x-full",
                ])}
                aria-describedby={undefined}
              >
                <div className="">
                  <div className="flex items-center justify-between gap-2 px-4 pt-1.5 pb-0.5">
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
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </Await>
    </Suspense>
  );
}
