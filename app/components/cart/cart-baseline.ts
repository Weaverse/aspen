import type { Fetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import type { CartMutationResponse } from "./cart-types";

let freshestFetcherCart: CartApiQueryFragment | null = null;
let cartMutationEpoch = 0;
let recordedMutationCarts = new WeakSet<object>();

export function getTimestampMs(dateString: string | undefined): number {
  return dateString ? new Date(dateString).getTime() : 0;
}

export function hasCartResponseErrors(value: unknown) {
  const response = value as CartMutationResponse | undefined;
  return Boolean(response?.errors?.length || response?.userErrors?.length);
}

export function recordCartMutation(cart: CartApiQueryFragment) {
  if (recordedMutationCarts.has(cart)) {
    return;
  }
  recordedMutationCarts.add(cart);
  cartMutationEpoch += 1;
  if (
    !freshestFetcherCart ||
    getTimestampMs(cart.updatedAt) >=
      getTimestampMs(freshestFetcherCart.updatedAt)
  ) {
    freshestFetcherCart = cart;
  }
}

export function getCartMutationEpoch() {
  return cartMutationEpoch;
}

export function canApplyNullCart(epochAtRequestStart: number) {
  return cartMutationEpoch === epochAtRequestStart;
}

export function clearFreshestFetcherCart() {
  freshestFetcherCart = null;
}

/**
 * Pick one authoritative baseline. A loading fetcher already contains its
 * completed action result while route loaders revalidate, so it is safe to
 * adopt before React Router can discard an unmounted fetcher.
 */
export function resolveBaselineCart(
  serverCart: CartApiQueryFragment | null,
  fetchers: Fetcher<unknown>[] = [],
) {
  let cart = serverCart;
  let updatedAt = getTimestampMs(serverCart?.updatedAt);

  const freshestFetcherTime = getTimestampMs(freshestFetcherCart?.updatedAt);
  if (freshestFetcherCart && freshestFetcherTime > updatedAt) {
    cart = freshestFetcherCart;
    updatedAt = freshestFetcherTime;
  }

  for (const fetcher of fetchers) {
    if (fetcher.state === "submitting" || hasCartResponseErrors(fetcher.data)) {
      continue;
    }
    const fetcherCart = (fetcher.data as CartMutationResponse | undefined)
      ?.cart;
    if (!fetcherCart?.id || !fetcherCart.lines) {
      continue;
    }
    const fetcherTime = getTimestampMs(fetcherCart.updatedAt);
    if (fetcherTime >= updatedAt) {
      cart = fetcherCart;
      updatedAt = fetcherTime;
      recordCartMutation(fetcherCart);
    }
  }

  return { cart, updatedAt };
}

export function resetCartBaselineForTests() {
  freshestFetcherCart = null;
  cartMutationEpoch = 0;
  recordedMutationCarts = new WeakSet<object>();
}
