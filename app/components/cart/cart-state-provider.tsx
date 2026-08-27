import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFetchers } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";

type CartState = {
  cart: CartApiQueryFragment | null;
  isResolved: boolean;
};

type CartStateContextValue = CartState & {
  updateCart: (cart: CartApiQueryFragment | null) => void;
};

type CartMutationData = {
  cart?: CartApiQueryFragment | null;
};

const CartStateContext = createContext<CartStateContextValue | undefined>(
  undefined,
);
const CART_STATE_EVENT = "cart-state-update";

export function syncCartState(cart: CartApiQueryFragment | null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CART_STATE_EVENT, { detail: { cart } }),
    );
  }
}

function hasCartResponse(value: unknown): value is CartMutationData {
  if (!(value && typeof value === "object" && "cart" in value)) {
    return false;
  }

  const cart = (value as CartMutationData).cart;
  return (
    cart === null ||
    Boolean(
      cart &&
        typeof cart === "object" &&
        cart.lines &&
        Array.isArray(cart.lines.nodes),
    )
  );
}

/**
 * Keeps the cart returned by fetcher mutations available across the header,
 * drawer, and cart page without forcing every Weaverse page loader to rerun.
 */
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
  const fetchers = useFetchers();
  const [state, setState] = useState<CartState>({
    cart: null,
    isResolved: false,
  });
  const processedResponses = useRef(new Set<string>());
  const cartMutationVersion = useRef(0);

  const updateCart = useCallback((cart: CartApiQueryFragment | null) => {
    cartMutationVersion.current += 1;
    setState((current) => ({ ...current, cart, isResolved: true }));
  }, []);

  useEffect(() => {
    const handleCartUpdate = (
      event: CustomEvent<{ cart: CartApiQueryFragment | null }>,
    ) => updateCart(event.detail.cart);

    window.addEventListener(
      CART_STATE_EVENT,
      handleCartUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        CART_STATE_EVENT,
        handleCartUpdate as EventListener,
      );
    };
  }, [updateCart]);

  useEffect(() => {
    let isCurrent = true;
    const versionAtStart = cartMutationVersion.current;

    Promise.resolve(initialCart).then((cart) => {
      if (isCurrent && versionAtStart === cartMutationVersion.current) {
        setState({ cart, isResolved: true });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [initialCart]);

  useEffect(() => {
    for (const fetcher of fetchers) {
      // Let Hydrogen finish applying the optimistic form data before replacing
      // it with Shopify's authoritative cart. Updating while the fetcher is
      // still loading would apply the same update/remove operation twice.
      if (fetcher.state !== "idle") {
        continue;
      }

      const response = fetcher.data;
      if (!hasCartResponse(response)) {
        continue;
      }

      const signature = response.cart
        ? [
            response.cart.id,
            response.cart.updatedAt,
            response.cart.totalQuantity,
          ].join(":")
        : `empty:${fetcher.key}`;

      if (processedResponses.current.has(signature)) {
        continue;
      }

      processedResponses.current.add(signature);
      window.setTimeout(() => updateCart(response.cart ?? null), 0);
    }
  }, [fetchers, updateCart]);

  return (
    <CartStateContext.Provider value={{ ...state, updateCart }}>
      {children}
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (!context) {
    throw new Error("useCartState must be used within CartStateProvider");
  }
  return context;
}
