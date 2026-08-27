import assert from "node:assert/strict";
import test from "node:test";
import type { OptimisticCartLineInput } from "@shopify/hydrogen";
import {
  canApplyNullCart,
  getCartMutationEpoch,
  recordCartMutation,
  resetCartBaselineForTests,
  resolveBaselineCart,
} from "../app/components/cart/cart-baseline.ts";
import {
  claimPendingLineUpdate,
  clearPendingLineUpdate,
  settlePendingLineUpdate,
  stagePendingLineUpdate,
} from "../app/components/cart/cart-line-queue.ts";
import {
  applyOptimisticMutations,
  buildOptimisticAddCart,
  filterRemovedCartLines,
  resetOptimisticCartForTests,
} from "../app/components/cart/optimistic-cart.ts";

const variantId = "gid://shopify/ProductVariant/1";

function createInput(quantity = 1): OptimisticCartLineInput {
  return {
    merchandiseId: variantId,
    quantity,
    selectedVariant: {
      id: variantId,
      title: "Default Title",
      availableForSale: true,
      price: { amount: "25.00", currencyCode: "USD" },
      product: {
        id: "gid://shopify/Product/1",
        handle: "test-product",
        title: "Test product",
      },
      selectedOptions: [{ name: "Title", value: "Default Title" }],
    },
  } as OptimisticCartLineInput;
}

function createCart(quantity: number, updatedAt: string) {
  const cart = buildOptimisticAddCart([createInput(quantity)]);
  assert.ok(cart);
  return {
    ...cart,
    id: "gid://shopify/Cart/1",
    updatedAt,
    isOptimistic: false,
    lines: {
      ...cart.lines,
      nodes: cart.lines.nodes.map((line) => ({
        ...line,
        id: "gid://shopify/CartLine/1",
        isOptimistic: false,
      })),
    },
  };
}

test.beforeEach(() => {
  resetCartBaselineForTests();
  resetOptimisticCartForTests();
});

test("selects the newest error-free authoritative cart", () => {
  const serverCart = createCart(1, "2026-08-27T10:00:00.000Z");
  const newerCart = createCart(3, "2026-08-27T10:00:02.000Z");
  const errorCart = createCart(9, "2026-08-27T10:00:03.000Z");
  const fetchers = [
    { state: "idle", data: { cart: newerCart } },
    {
      state: "idle",
      data: { cart: errorCart, userErrors: [{ message: "Rejected" }] },
    },
  ] as Parameters<typeof resolveBaselineCart>[1];

  const resolved = resolveBaselineCart(serverCart, fetchers);

  assert.equal(resolved.cart?.totalQuantity, 3);
  assert.equal(resolved.cart?.updatedAt, newerCart.updatedAt);
});

test("adopts a completed action cart while its fetcher is loading", () => {
  const serverCart = createCart(1, "2026-08-27T10:00:00.000Z");
  const mutationCart = createCart(3, "2026-08-27T10:00:02.000Z");
  const fetchers = [
    { state: "loading", data: { cart: mutationCart } },
  ] as Parameters<typeof resolveBaselineCart>[1];

  const resolved = resolveBaselineCart(serverCart, fetchers);

  assert.equal(resolved.cart?.totalQuantity, 3);
  assert.equal(resolved.cart?.updatedAt, mutationCart.updatedAt);
});

test("does not allow a stale null loader to erase a completed mutation", () => {
  const requestEpoch = getCartMutationEpoch();
  recordCartMutation(createCart(1, "2026-08-27T10:00:01.000Z"));

  assert.equal(canApplyNullCart(requestEpoch), false);
});

test("keeps the latest rapid quantity target until it is submitted", () => {
  const lineId = "gid://shopify/CartLine/1";
  let pending = stagePendingLineUpdate(new Map(), lineId, 2);
  pending = stagePendingLineUpdate(pending, lineId, 4);
  pending = clearPendingLineUpdate(pending, lineId, 2);

  assert.equal(pending.get(lineId), 4);

  pending = clearPendingLineUpdate(pending, lineId, 4);
  assert.equal(pending.has(lineId), false);
});

test("keeps a newer quantity queued while an earlier request settles", () => {
  const lineId = "gid://shopify/CartLine/1";
  let pending = stagePendingLineUpdate(new Map(), lineId, 2);
  let inFlight = new Map<string, number>();

  const first = claimPendingLineUpdate(pending, inFlight, lineId);
  assert.equal(first.quantity, 2);
  inFlight = first.inFlight;

  pending = stagePendingLineUpdate(pending, lineId, 4);
  const settledFirst = settlePendingLineUpdate(pending, inFlight, lineId, 2);
  assert.equal(settledFirst.pending.get(lineId), 4);
  assert.equal(settledFirst.inFlight.has(lineId), false);

  const second = claimPendingLineUpdate(
    settledFirst.pending,
    settledFirst.inFlight,
    lineId,
  );
  assert.equal(second.quantity, 4);
  const settledSecond = settlePendingLineUpdate(
    settledFirst.pending,
    second.inFlight,
    lineId,
    4,
  );
  assert.equal(settledSecond.pending.has(lineId), false);
  assert.equal(settledSecond.inFlight.has(lineId), false);
});

test("composes the queued quantity over the freshest baseline", () => {
  const baseline = createCart(1, "2026-08-27T10:00:00.000Z");
  const lineId = baseline.lines.nodes[0].id;
  const cart = applyOptimisticMutations(
    baseline,
    [],
    [],
    new Map([[lineId, 5]]),
  );

  assert.equal(cart?.lines.nodes[0].quantity, 5);
  assert.equal(cart?.totalQuantity, 5);
  assert.equal(cart?.isOptimistic, true);
});

test("does not replay an add already included in a loading fetcher cart", () => {
  const baseline = createCart(2, "2026-08-27T10:00:02.000Z");
  const formData = new FormData();
  formData.set(
    "cartFormInput",
    JSON.stringify({
      action: "LinesAdd",
      inputs: { lines: [createInput(1)] },
    }),
  );
  const fetchers = [
    { state: "loading", formData, data: { cart: baseline } },
  ] as Parameters<typeof applyOptimisticMutations>[1];

  const optimistic = applyOptimisticMutations(
    baseline,
    fetchers,
    [],
    new Map(),
  );

  assert.equal(optimistic, null);
});

test("hides a removed line until an authoritative cart confirms removal", () => {
  const baseline = createCart(1, "2026-08-27T10:00:00.000Z");
  const formData = new FormData();
  formData.set(
    "cartFormInput",
    JSON.stringify({
      action: "LinesRemove",
      inputs: { lineIds: [baseline.lines.nodes[0].id] },
    }),
  );
  const fetchers = [{ state: "submitting", formData }] as Parameters<
    typeof applyOptimisticMutations
  >[1];

  const cart = applyOptimisticMutations(baseline, fetchers, [], new Map());

  assert.equal(cart?.lines.nodes.length, 0);
  assert.equal(cart?.totalQuantity, 0);
});

test("restores an optimistically removed line when Shopify rejects it", () => {
  const baseline = createCart(1, "2026-08-27T10:00:00.000Z");
  const hidden = filterRemovedCartLines(
    baseline,
    new Set([baseline.lines.nodes[0].id]),
  );
  assert.equal(hidden.lines.nodes.length, 0);

  const restored = filterRemovedCartLines(baseline, new Set());

  assert.equal(restored.lines.nodes.length, 1);
  assert.equal(restored.totalQuantity, 1);
});
