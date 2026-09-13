import type { ReactNode } from "react";
import type { Fetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import {
  clearFreshestFetcherCart,
  getTimestampMs,
  recordCartMutation,
} from "./cart-baseline";
import { CartStoreSync, useCartFetcherSync } from "./cart-sync";
import { useCart, useCartStore } from "./store";

/** Compatibility interface for existing Aspen callers; Zustand owns all state. */
export function syncCartState(cart: CartApiQueryFragment | null) {
  if (cart) {
    recordCartMutation(cart);
    const current = useCartStore.getState().serverCart;
    if (getTimestampMs(cart.updatedAt) < getTimestampMs(current?.updatedAt)) {
      return;
    }
  } else {
    clearFreshestFetcherCart();
  }
  useCartStore.setState({ serverCart: cart, isResolved: true });
}

export function CartStateProvider({
  children,
  initialCart,
}: {
  children: ReactNode;
  initialCart:
    | CartApiQueryFragment
    | null
    | Promise<CartApiQueryFragment | null>;
}) {
  return (
    <>
      <CartStoreSync initialCart={initialCart} />
      {children}
    </>
  );
}

export function useCartState() {
  const cart = useCart();
  const isResolved = useCartStore((state) => state.isResolved);
  return { cart, isResolved, updateCart: syncCartState };
}

export function useSyncCartResponse(fetcher: {
  state: string;
  data?: unknown;
}) {
  useCartFetcherSync(fetcher as Fetcher<unknown>);
}

export function CartResponseSync({
  fetcher,
}: {
  fetcher: { state: string; data?: unknown };
}) {
  useSyncCartResponse(fetcher);
  return null;
}
