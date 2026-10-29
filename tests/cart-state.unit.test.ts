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
  getActiveStagedLines,
  type PendingAdd,
  resetOptimisticCartForTests,
} from "../app/components/cart/optimistic-cart.ts";
import {
  canAdjustLineQuantity,
  pruneCompletedPendingAdds,
  useCartStore,
} from "../app/components/cart/store.ts";

const variantId = "gid://shopify/ProductVariant/1";

function createInput(quantity = 1): OptimisticCartLineInput {
  return {
    merchandiseId: variantId,
    quantity,
    selectedVariant: {
      id: variantId,
      title: "Default Title",
      availableForSale: true,
      quantityAvailable: 100,
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
  useCartStore.setState({
    serverCart: null,
    pendingAdds: new Map(),
    pendingLineUpdates: new Map(),
    lineUpdatesInFlight: new Map(),
    lineUpdateErrors: new Map(),
    lineQuantityLimits: new Map(),
    pendingLineRemovals: new Set(),
  });
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

test("never displays an optimistic quantity above known stock while Shopify validates it", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, { quantityAvailable: 3 });
  const cart = applyOptimisticMutations(
    baseline,
    [],
    [],
    new Map([[line.id, 10]]),
  );

  assert.equal(cart?.lines.nodes[0].quantity, 3);
  assert.equal(cart?.totalQuantity, 3);
});

test("rejects repeated quantity increases at the stock boundary while a request is pending", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, { quantityAvailable: 3 });
  useCartStore.setState({ serverCart: baseline });
  useCartStore.getState().stageLineUpdate(line.id, 3);
  assert.equal(useCartStore.getState().claimLineUpdate(line.id), 3);
  for (let quantity = 4; quantity <= 10; quantity += 1) {
    useCartStore.getState().stageLineUpdate(line.id, quantity);
  }
  assert.equal(useCartStore.getState().pendingLineUpdates.get(line.id), 3);
});

test("stock bounds account for another cart line sharing the same variant", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, { quantityAvailable: 3 });
  baseline.lines.nodes.push({ ...line, id: "second-line", quantity: 1 });
  const cart = applyOptimisticMutations(
    baseline,
    [],
    [],
    new Map([[line.id, 3]]),
  );
  assert.equal(cart?.lines.nodes[0].quantity, 2);
  assert.equal(cart?.totalQuantity, 3);
});

test("stock validation never invents a quantity that violates the variant increment", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, {
    quantityAvailable: 3,
    quantityRule: { minimum: 2, maximum: 6, increment: 2 },
  });
  const cart = applyOptimisticMutations(
    baseline,
    [],
    [],
    new Map([[line.id, 4]]),
  );
  assert.equal(cart?.lines.nodes[0].quantity, 2);
});

test("atomic adjustments preserve quantity rules and rapid increases inside stock", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, {
    quantityAvailable: 100,
    quantityRule: { minimum: 2, maximum: 6, increment: 2 },
  });
  useCartStore.setState({ serverCart: baseline });
  assert.equal(
    canAdjustLineQuantity(useCartStore.getState(), line.id, -1),
    false,
  );
  for (let i = 0; i < 10; i += 1) {
    useCartStore.getState().adjustLineQuantity(line.id, 1);
  }
  assert.equal(useCartStore.getState().pendingLineUpdates.get(line.id), 6);
  assert.equal(
    canAdjustLineQuantity(useCartStore.getState(), line.id, 1),
    false,
  );
  useCartStore.getState().adjustLineQuantity(line.id, -1);
  assert.equal(useCartStore.getState().pendingLineUpdates.get(line.id), 4);
});

test("a cart quantity above an updated maximum can still be reduced", () => {
  const baseline = createCart(10, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, {
    quantityRule: { minimum: 2, maximum: 6, increment: 2 },
  });
  useCartStore.setState({ serverCart: baseline });
  useCartStore.getState().adjustLineQuantity(line.id, -1);
  assert.equal(useCartStore.getState().pendingLineUpdates.get(line.id), 6);
});

test("a confirmed limit is released when another line frees inventory for the same variant", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const line = baseline.lines.nodes[0];
  Object.assign(line.merchandise, { quantityAvailable: 3 });
  baseline.lines.nodes.push({ ...line, id: "second-line", quantity: 1 });
  useCartStore.setState({ serverCart: baseline });
  useCartStore.getState().stageLineUpdate(line.id, 3);
  useCartStore.getState().claimLineUpdate(line.id);
  useCartStore.getState().settleLineUpdate(line.id, 3, { cart: baseline });
  assert.equal(
    canAdjustLineQuantity(useCartStore.getState(), line.id, 1),
    false,
  );
  const afterRemoval = { ...baseline, lines: { nodes: [line] } };
  useCartStore.setState({ serverCart: afterRemoval });
  assert.equal(
    canAdjustLineQuantity(useCartStore.getState(), line.id, 1),
    true,
  );
});

test("a stock adjustment clears newer queued overshoots but retains a newer decrease", () => {
  for (const nextQuantity of [1, 5]) {
    const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
    const line = baseline.lines.nodes[0];
    useCartStore.setState({ serverCart: baseline });
    useCartStore.getState().stageLineUpdate(line.id, 3);
    useCartStore.getState().claimLineUpdate(line.id);
    useCartStore.getState().stageLineUpdate(line.id, nextQuantity);
    const accepted = createCart(2, "2026-08-27T10:00:01.000Z");
    Object.assign(accepted.lines.nodes[0].merchandise, {
      quantityAvailable: 2,
    });
    useCartStore.setState({ serverCart: accepted });
    useCartStore.getState().settleLineUpdate(line.id, 3, { cart: accepted });
    assert.equal(
      useCartStore.getState().pendingLineUpdates.get(line.id),
      nextQuantity === 1 ? 1 : undefined,
    );
    assert.ok(useCartStore.getState().lineQuantityLimits.has(line.id));
    assert.equal(useCartStore.getState().lineUpdateErrors.has(line.id), false);
    // Isolate the second scenario from the first one's pending decrease.
    useCartStore.setState({
      pendingLineUpdates: new Map(),
      lineUpdateErrors: new Map(),
      lineQuantityLimits: new Map(),
    });
  }
});

test("a completed quantity response never replays rejected targets during fetcher loading", () => {
  const baseline = createCart(3, "2026-08-27T10:00:02.000Z");
  const line = baseline.lines.nodes[0];
  const formData = new FormData();
  formData.set(
    "cartFormInput",
    JSON.stringify({
      action: "LinesUpdate",
      inputs: { lines: [{ id: line.id, quantity: 5 }] },
    }),
  );
  const fetchers = [
    { state: "loading", formData, data: { cart: baseline } },
  ] as Parameters<typeof applyOptimisticMutations>[1];
  assert.equal(
    applyOptimisticMutations(baseline, fetchers, [], new Map()),
    null,
  );
  const queuedIncrease = applyOptimisticMutations(
    baseline,
    fetchers,
    [],
    new Map([[line.id, 7]]),
  );
  assert.equal(
    queuedIncrease?.lines.nodes[0].quantity ?? baseline.lines.nodes[0].quantity,
    3,
  );
  const queuedDecrease = applyOptimisticMutations(
    baseline,
    fetchers,
    [],
    new Map([[line.id, 2]]),
  );
  assert.equal(queuedDecrease?.lines.nodes[0].quantity, 2);
});

test("a newer shared-inventory baseline supersedes an older adjustment without replaying its request", () => {
  const adjusted = createCart(2, "2026-08-27T10:00:01.000Z");
  const line = adjusted.lines.nodes[0];
  Object.assign(line.merchandise, { quantityAvailable: 5 });
  adjusted.lines.nodes.push({ ...line, id: "subscription-line", quantity: 3 });
  adjusted.totalQuantity = 5;
  const form = (id: string, quantity: number) => {
    const formData = new FormData();
    formData.set(
      "cartFormInput",
      JSON.stringify({
        action: "LinesUpdate",
        inputs: { lines: [{ id, quantity }] },
      }),
    );
    return formData;
  };
  for (const otherQuantity of [1, 3]) {
    const baseline = structuredClone(adjusted);
    baseline.updatedAt = "2026-08-27T10:00:02.000Z";
    baseline.lines.nodes[1].quantity = otherQuantity;
    baseline.totalQuantity = 2 + otherQuantity;
    const fetchers = [
      {
        state: "loading",
        formData: form(line.id, 3),
        data: { cart: adjusted },
      },
      {
        state: "loading",
        formData: form("subscription-line", otherQuantity),
        data: { cart: baseline },
      },
    ] as Parameters<typeof applyOptimisticMutations>[1];
    assert.equal(
      applyOptimisticMutations(baseline, fetchers, [], new Map()),
      null,
    );
    const pending = applyOptimisticMutations(
      baseline,
      fetchers,
      [],
      new Map([[line.id, 3]]),
    );
    assert.equal(pending?.lines.nodes[0].quantity, otherQuantity === 1 ? 3 : 2);
    assert.equal(pending?.totalQuantity, otherQuantity === 1 ? 4 : 5);
    assert.equal(
      applyOptimisticMutations(baseline, fetchers, [], new Map([[line.id, 1]]))
        ?.lines.nodes[0].quantity,
      1,
    );
  }
});

test("a subscription-only line update leaves quantity unchanged", () => {
  const baseline = createCart(2, "2026-08-27T10:00:00.000Z");
  const formData = new FormData();
  formData.set(
    "cartFormInput",
    JSON.stringify({
      action: "LinesUpdate",
      inputs: {
        lines: [{ id: baseline.lines.nodes[0].id, sellingPlanId: "plan-1" }],
      },
    }),
  );
  const fetchers = [{ state: "submitting", formData }] as Parameters<
    typeof applyOptimisticMutations
  >[1];
  assert.equal(
    applyOptimisticMutations(baseline, fetchers, [], new Map()),
    null,
  );
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

test("keeps staged adds until their owning fetcher completes", () => {
  const pending = new Map<string, PendingAdd>([
    [
      "add-1",
      {
        lines: [createInput(1)],
        stagedFromUpdatedAt: "2026-08-27T10:00:00.000Z",
      },
    ],
  ]);

  assert.equal(
    getActiveStagedLines(pending, Date.parse("2026-08-27T10:00:02.000Z"))
      .length,
    1,
  );
});

test("prunes only staged adds whose fetcher has completed", () => {
  const pending = new Map<string, PendingAdd>([
    ["add-1", { lines: [createInput(1)], stagedFromUpdatedAt: "" }],
    ["add-2", { lines: [createInput(2)], stagedFromUpdatedAt: "" }],
  ]);
  const completedFormData = new FormData();
  completedFormData.set("cartStageToken", "add-1");
  const activeFormData = new FormData();
  activeFormData.set("cartStageToken", "add-2");

  const active = pruneCompletedPendingAdds(pending, [
    { state: "idle", data: { cart: {} }, formData: completedFormData },
    { state: "submitting", formData: activeFormData },
  ] as Parameters<typeof pruneCompletedPendingAdds>[1]);

  assert.deepEqual([...active.keys()], ["add-2"]);
});
