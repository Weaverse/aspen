import { type Fetcher, useFetchers } from "react-router";
import { create } from "zustand";
import type { OptimisticCartLineInput } from "~/components/cart/cart-types";
import type { CartApiQueryFragment } from "~/graphql/storefront-types";
import { resolveBaselineCart } from "./cart-baseline";
import {
  getLineQuantityRules,
  getNextLineQuantity,
  getOptimisticLineQuantity,
  getOtherVariantQuantity,
} from "./cart-line-quantity";
import {
  claimPendingLineUpdate,
  settlePendingLineUpdate,
  stagePendingLineUpdate,
} from "./cart-line-queue";
import type {
  CartLine,
  CartMutationResponse,
  CartWithOptimistic,
} from "./cart-types";
import {
  applyOptimisticMutations,
  buildOptimisticAddCart,
  cartLineIdentity,
  filterRemovedCartLines,
  getActiveStagedLines,
  type PendingAdd,
} from "./optimistic-cart";

type CartStore = {
  isResolved: boolean;
  isOpen: boolean;
  serverCart: CartApiQueryFragment | null;
  inventoryPolicies: Map<string, "DENY" | "CONTINUE" | null>;
  pendingAdds: Map<string, PendingAdd>;
  pendingLineUpdates: Map<string, number>;
  lineUpdatesInFlight: Map<string, number>;
  lineUpdateErrors: Map<string, CartMutationResponse>;
  lineQuantityLimits: Map<string, CartApiQueryFragment>;
  pendingLineRemovals: Set<string>;
  lineRemovalErrors: Map<string, CartMutationResponse>;
  open: () => void;
  close: () => void;
  toggle: (open?: boolean) => void;
  stagePendingAdd: (lines: OptimisticCartLineInput[]) => string | null;
  clearPendingAdd: (token: string) => void;
  stageLineUpdate: (lineId: string, quantity: number) => void;
  adjustLineQuantity: (lineId: string, direction: 1 | -1) => void;
  claimLineUpdate: (lineId: string) => number | null;
  settleLineUpdate: (
    lineId: string,
    submittedQuantity: number,
    response?: CartMutationResponse,
  ) => void;
  stageLineRemoval: (lineId: string) => void;
  settleLineRemoval: (lineId: string, response?: CartMutationResponse) => void;
};

let pendingAddSequence = 0;

function getQuantitySnapshot(state: CartStore) {
  const { cart: resolved } = resolveBaselineCart(state.serverCart);
  if (!resolved) {
    return buildOptimisticAddCart(getActiveStagedLines(state.pendingAdds, 0));
  }
  const cart = filterRemovedCartLines(resolved, state.pendingLineRemovals);
  return (
    applyOptimisticMutations(
      cart,
      [],
      getActiveStagedLines(state.pendingAdds, 0),
      state.pendingLineUpdates,
    ) ?? cart
  );
}

function getReservedCart(state: CartStore) {
  const { cart: baseline } = resolveBaselineCart(state.serverCart);
  // Reserve decreases/removals until Shopify confirms them. Apply absolute
  // quantity intentions before additions so neither reservation is lost.
  const reserved = baseline && {
    ...baseline,
    lines: {
      ...baseline.lines,
      nodes: baseline.lines.nodes
        .filter((line) => line.quantity > 0)
        .map((line) => ({
          ...line,
          quantity: Math.max(
            line.quantity,
            state.pendingLineUpdates.get(line.id) ?? 0,
            state.lineUpdatesInFlight.get(line.id) ?? 0,
          ),
        })),
    },
  };
  const staged = getActiveStagedLines(state.pendingAdds, 0);
  return reserved
    ? (applyOptimisticMutations(reserved, [], staged, new Map()) ?? reserved)
    : buildOptimisticAddCart(staged);
}

/** Inventory is shared across all selling plans and attributes of a variant. */
export function canAddCartLines(
  state: CartStore,
  lines: OptimisticCartLineInput[],
) {
  const cart = getReservedCart(state);
  const quantities = new Map<string, number>();
  const lineQuantities = new Map<string, number>();
  for (const line of cart?.lines.nodes ?? []) {
    quantities.set(
      line.merchandise.id,
      (quantities.get(line.merchandise.id) ?? 0) + line.quantity,
    );
    lineQuantities.set(cartLineIdentity(line), line.quantity);
  }
  for (const line of lines) {
    const id = line.merchandiseId;
    const existing = cart?.lines.nodes.find(
      (node) => node.merchandise.id === id,
    );
    const variant =
      existing?.merchandise ??
      (line.selectedVariant as Partial<CartLine["merchandise"]> | undefined);
    const total = (quantities.get(id) ?? 0) + (line.quantity ?? 1);
    const stock = variant?.quantityAvailable;
    const policy = state.inventoryPolicies.get(id);
    const identity = cartLineIdentity(line);
    const matchingLine = cart?.lines.nodes.find(
      (node) => cartLineIdentity(node) === identity,
    );
    const lineTotal =
      (lineQuantities.get(identity) ?? 0) + (line.quantity ?? 1);
    if (matchingLine && cart) {
      const { maximum } = getLineQuantityRules(matchingLine);
      const confirmedMaximum = getConfirmedLineMaximum(
        state,
        matchingLine,
        cart,
      );
      if (
        (maximum !== null && lineTotal > maximum) ||
        (confirmedMaximum !== null && lineTotal > confirmedMaximum)
      ) {
        return false;
      }
    }
    if (
      (existing || policy === "DENY") &&
      typeof stock === "number" &&
      stock >= 0 &&
      !variant?.currentlyNotInStock &&
      policy !== "CONTINUE" &&
      policy !== null &&
      total > stock
    ) {
      return false;
    }
    quantities.set(id, total);
    lineQuantities.set(identity, lineTotal);
  }
  return true;
}

function getConfirmedLineMaximum(
  state: CartStore,
  line: CartLine,
  cart: CartWithOptimistic,
) {
  const previous = state.lineQuantityLimits.get(line.id);
  const adjusted = previous?.lines.nodes.find((node) => node.id === line.id);
  const { minimum, maximum, increment } = getLineQuantityRules(line);
  return adjusted &&
    adjusted.merchandise.quantityAvailable ===
      line.merchandise.quantityAvailable &&
    adjusted.merchandise.currentlyNotInStock ===
      line.merchandise.currentlyNotInStock &&
    getLineQuantityRules(adjusted).minimum === minimum &&
    getLineQuantityRules(adjusted).maximum === maximum &&
    getLineQuantityRules(adjusted).increment === increment &&
    getOtherVariantQuantity(adjusted, previous.lines.nodes) ===
      getOtherVariantQuantity(line, cart.lines.nodes)
    ? adjusted.quantity
    : null;
}

/** Quantity controls lock only when no additional unit can fit in the cart. */
export function useCanAddVariant(
  merchandiseId: string | undefined,
  sellingPlanId?: string | null,
) {
  return useCartStore((state) =>
    merchandiseId
      ? canAddCartLines(state, [
          {
            merchandiseId,
            quantity: 1,
            sellingPlanId: sellingPlanId ?? undefined,
          },
        ])
      : false,
  );
}

function canStageLineQuantity(
  state: CartStore,
  lineId: string,
  quantity: number,
  cart = getQuantitySnapshot(state),
) {
  const line = cart?.lines.nodes.find((node) => node.id === lineId);
  if (
    !line ||
    lineId.startsWith("optimistic-") ||
    state.pendingLineRemovals.has(lineId)
  ) {
    return false;
  }
  const { minimum, maximum, increment } = getLineQuantityRules(line);
  if (
    !Number.isInteger(quantity) ||
    quantity < minimum ||
    quantity % increment !== 0 ||
    (maximum !== null && quantity > maximum)
  ) {
    return false;
  }
  const pending = state.pendingLineUpdates.get(lineId);
  // Wait for policy at the stock boundary. A failed lookup (null) retains
  // Shopify validation rather than accidentally disabling backorders.
  const policy = state.inventoryPolicies.get(line.merchandise.id);
  const reserved = getReservedCart(state);
  const { cart: authoritative } = resolveBaselineCart(state.serverCart);
  const authoritativeQuantity =
    authoritative?.lines.nodes.find((node) => node.id === lineId)?.quantity ??
    0;
  const reservedQuantity =
    reserved?.lines.nodes.reduce(
      (sum, node) =>
        node.merchandise.id === line.merchandise.id ? sum + node.quantity : sum,
      0,
    ) ?? 0;
  const additionalQuantity = Math.max(
    0,
    quantity -
      Math.max(
        authoritativeQuantity,
        state.pendingLineUpdates.get(lineId) ?? 0,
        state.lineUpdatesInFlight.get(lineId) ?? 0,
      ),
  );
  if (
    quantity > line.quantity &&
    typeof line.merchandise.quantityAvailable === "number" &&
    !line.merchandise.currentlyNotInStock &&
    policy !== "CONTINUE" &&
    policy !== null &&
    reservedQuantity + additionalQuantity > line.merchandise.quantityAvailable
  ) {
    return false;
  }
  if (
    quantity === line.quantity &&
    (pending === undefined || pending === quantity)
  ) {
    return false;
  }
  if (
    quantity > line.quantity &&
    pending !== undefined &&
    (pending > line.quantity ||
      getOptimisticLineQuantity(line, quantity, cart.lines.nodes) <=
        line.quantity)
  ) {
    return false;
  }
  const confirmedMaximum = getConfirmedLineMaximum(state, line, cart);
  if (confirmedMaximum !== null && quantity > confirmedMaximum) {
    return false;
  }
  return true;
}

export function canAdjustLineQuantity(
  state: CartStore,
  lineId: string,
  direction: 1 | -1,
) {
  const cart = getQuantitySnapshot(state);
  const line = cart?.lines.nodes.find((node) => node.id === lineId);
  return Boolean(
    line &&
      canStageLineQuantity(
        state,
        lineId,
        getNextLineQuantity(line, direction),
        cart,
      ),
  );
}

function stageQuantity(
  state: CartStore,
  lineId: string,
  quantity: number,
  cart = getQuantitySnapshot(state),
) {
  if (!canStageLineQuantity(state, lineId, quantity, cart)) {
    return {};
  }
  const lineUpdateErrors = new Map(state.lineUpdateErrors);
  lineUpdateErrors.delete(lineId);
  const lineQuantityLimits = new Map(state.lineQuantityLimits);
  lineQuantityLimits.delete(lineId);
  return {
    pendingLineUpdates: stagePendingLineUpdate(
      state.pendingLineUpdates,
      lineId,
      quantity,
    ),
    lineUpdateErrors,
    lineQuantityLimits,
  };
}

export const useCartStore = create<CartStore>()((set) => ({
  isResolved: false,
  isOpen: false,
  serverCart: null,
  inventoryPolicies: new Map(),
  pendingAdds: new Map(),
  pendingLineUpdates: new Map(),
  lineUpdatesInFlight: new Map(),
  lineUpdateErrors: new Map(),
  lineQuantityLimits: new Map(),
  pendingLineRemovals: new Set(),
  lineRemovalErrors: new Map(),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: (open) =>
    set((state) => ({
      isOpen: open === undefined ? !state.isOpen : open,
    })),
  stagePendingAdd: (lines) => {
    const usableLines = lines.filter((line) => line.selectedVariant);
    if (usableLines.length === 0) {
      return null;
    }
    pendingAddSequence += 1;
    const token = `add-${pendingAddSequence}`;
    const { cart } = resolveBaselineCart(useCartStore.getState().serverCart);
    set((state) => {
      const pendingAdds = new Map(state.pendingAdds);
      pendingAdds.set(token, {
        lines: usableLines,
        stagedFromUpdatedAt: cart?.updatedAt ?? "",
      });
      return { pendingAdds };
    });
    return token;
  },
  clearPendingAdd: (token) =>
    set((state) => {
      if (!state.pendingAdds.has(token)) {
        return {};
      }
      const pendingAdds = new Map(state.pendingAdds);
      pendingAdds.delete(token);
      return { pendingAdds };
    }),
  stageLineUpdate: (lineId, quantity) =>
    set((state) => stageQuantity(state, lineId, quantity)),
  adjustLineQuantity: (lineId, direction) =>
    set((state) => {
      const cart = getQuantitySnapshot(state);
      const line = cart?.lines.nodes.find((node) => node.id === lineId);
      return line
        ? stageQuantity(
            state,
            lineId,
            getNextLineQuantity(line, direction),
            cart,
          )
        : {};
    }),
  claimLineUpdate: (lineId) => {
    let claimedQuantity: number | null = null;
    set((state) => {
      const claimed = claimPendingLineUpdate(
        state.pendingLineUpdates,
        state.lineUpdatesInFlight,
        lineId,
      );
      claimedQuantity = claimed.quantity;
      if (claimed.inFlight === state.lineUpdatesInFlight) {
        return {};
      }
      return { lineUpdatesInFlight: claimed.inFlight };
    });
    return claimedQuantity;
  },
  settleLineUpdate: (lineId, submittedQuantity, response) =>
    set((state) => {
      const settled = settlePendingLineUpdate(
        state.pendingLineUpdates,
        state.lineUpdatesInFlight,
        lineId,
        submittedQuantity,
      );
      if (settled.inFlight === state.lineUpdatesInFlight) {
        return {};
      }
      const lineUpdateErrors = new Map(state.lineUpdateErrors);
      const lineQuantityLimits = new Map(state.lineQuantityLimits);
      const acceptedLine = response?.cart?.lines.nodes.find(
        (line) => line.id === lineId,
      );
      const adjusted =
        !response?.errors?.length &&
        !response?.userErrors?.length &&
        acceptedLine &&
        acceptedLine.quantity < submittedQuantity;
      if (response?.errors?.length || response?.userErrors?.length) {
        lineUpdateErrors.set(lineId, response);
      } else {
        lineUpdateErrors.delete(lineId);
      }
      if (adjusted) {
        lineQuantityLimits.set(lineId, response.cart);
      } else {
        lineQuantityLimits.delete(lineId);
      }
      // Do not replay a queued increase after Shopify reduced the submitted
      // quantity. A newer decrease remains a valid buyer intention.
      if (
        adjusted &&
        (settled.pending.get(lineId) ?? 0) > acceptedLine.quantity
      ) {
        settled.pending = new Map(settled.pending);
        settled.pending.delete(lineId);
      }
      return {
        pendingLineUpdates: settled.pending,
        lineUpdatesInFlight: settled.inFlight,
        lineUpdateErrors,
        lineQuantityLimits,
      };
    }),
  stageLineRemoval: (lineId) =>
    set((state) => {
      const pendingLineRemovals = new Set(state.pendingLineRemovals);
      pendingLineRemovals.add(lineId);
      const lineRemovalErrors = new Map(state.lineRemovalErrors);
      lineRemovalErrors.delete(lineId);
      return { pendingLineRemovals, lineRemovalErrors };
    }),
  settleLineRemoval: (lineId, response) =>
    set((state) => {
      if (!state.pendingLineRemovals.has(lineId)) {
        return {};
      }
      const pendingLineRemovals = new Set(state.pendingLineRemovals);
      pendingLineRemovals.delete(lineId);
      const lineRemovalErrors = new Map(state.lineRemovalErrors);
      const lineUpdateErrors = new Map(state.lineUpdateErrors);
      const lineQuantityLimits = new Map(state.lineQuantityLimits);
      if (response?.errors?.length || response?.userErrors?.length) {
        lineRemovalErrors.set(lineId, response);
      } else {
        lineRemovalErrors.delete(lineId);
        lineUpdateErrors.delete(lineId);
        lineQuantityLimits.delete(lineId);
      }
      return {
        pendingLineRemovals,
        lineRemovalErrors,
        lineUpdateErrors,
        lineQuantityLimits,
      };
    }),
}));

export function useCart(): CartWithOptimistic | null {
  const serverCart = useCartStore((state) => state.serverCart);
  const pendingAdds = useCartStore((state) => state.pendingAdds);
  const pendingLineUpdates = useCartStore((state) => state.pendingLineUpdates);
  const pendingLineRemovals = useCartStore(
    (state) => state.pendingLineRemovals,
  );
  const fetchers = useFetchers();
  const { cart: resolved, updatedAt } = resolveBaselineCart(
    serverCart,
    fetchers,
  );
  const activeAdds = pruneCompletedPendingAdds(pendingAdds, fetchers);
  const stagedLines = getActiveStagedLines(activeAdds, updatedAt);

  if (!resolved) {
    return stagedLines.length ? buildOptimisticAddCart(stagedLines) : null;
  }

  const baseline = filterRemovedCartLines(resolved, pendingLineRemovals);
  return (
    applyOptimisticMutations(
      baseline,
      fetchers,
      stagedLines,
      pendingLineUpdates,
    ) ?? baseline
  );
}

export function pruneCompletedPendingAdds(
  pendingAdds: Map<string, PendingAdd>,
  fetchers: Fetcher<unknown>[],
) {
  const activeAdds = new Map(pendingAdds);
  for (const fetcher of fetchers) {
    if (fetcher.state !== "submitting" && fetcher.data) {
      const token = fetcher.formData?.get("cartStageToken");
      if (typeof token === "string") {
        activeAdds.delete(token);
      }
    }
  }
  return activeAdds;
}
