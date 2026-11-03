import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { InMemoryCache } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { loadCartInventoryPolicies } from "../app/components/cart/use-cart-inventory-policy";
import { loader } from "../app/routes/($locale).api.cart-inventory-policy";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const id = "gid://shopify/ProductVariant/1";
function call(
  ids: string[],
  cache = new InMemoryCache(),
  waitUntil = (_promise: Promise<unknown>) => undefined,
  key = "test-key",
) {
  const params = new URLSearchParams(ids.map((value) => ["id", value]));
  return loader({
    request: new Request(
      `https://store.example/api/cart-inventory-policy?${params}`,
    ),
    context: {
      env: { WEAVERSE_API_KEY: key, PUBLIC_STORE_DOMAIN: "store.example" },
      cache,
      waitUntil,
    },
  } as unknown as LoaderFunctionArgs);
}

test("policy loader validates IDs and credentials before calling Admin", async () => {
  globalThis.fetch = async () => {
    throw new Error("Unexpected Admin request");
  };
  for (const ids of [
    [],
    ["bad"],
    Array.from({ length: 21 }, (_, i) => `gid://shopify/ProductVariant/${i}`),
  ]) {
    assert.equal((await call(ids)).init?.status, 400);
  }
  assert.equal((await call([id], undefined, undefined, "")).init?.status, 503);
});

test("Hydrogen cache reuses both policies and missing variants", async () => {
  for (const node of [
    null,
    { id, inventoryPolicy: "DENY", inventoryItem: { tracked: true } },
    { id, inventoryPolicy: "DENY", inventoryItem: { tracked: false } },
  ]) {
    const cache = new InMemoryCache();
    const pending: Promise<unknown>[] = [];
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json({ nodes: [node] });
    };
    const first = await call([id], cache, (promise) => {
      pending.push(promise);
    });
    await Promise.all(pending);
    const second = await call([id], cache);
    assert.equal(calls, 1);
    assert.deepEqual(first.data, second.data);
    assert.ok("policies" in first.data);
    assert.equal(
      first.data.policies?.[id],
      !node ? null : node.inventoryItem.tracked ? "DENY" : "CONTINUE",
    );
  }
});

test("remote failures return unavailable without inventing DENY", async () => {
  globalThis.fetch = async () =>
    Response.json({ errors: [{ message: "denied" }] });
  assert.equal((await call([id])).init?.status, 503);
});

test("client shares in-flight and fulfilled reads and retries failed reads", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ policies: { [id]: "DENY" } });
  };
  const one = loadCartInventoryPolicies("/test-policy", [id]);
  const two = loadCartInventoryPolicies("/test-policy", [id]);
  assert.equal(one, two);
  await one;
  await loadCartInventoryPolicies("/test-policy", [id]);
  assert.equal(calls, 1);
  globalThis.fetch = async () => {
    throw new Error("network");
  };
  assert.deepEqual(await loadCartInventoryPolicies("/retry-policy", [id]), {
    [id]: null,
  });
  globalThis.fetch = async () =>
    Response.json({ policies: { [id]: "CONTINUE" } });
  assert.deepEqual(await loadCartInventoryPolicies("/retry-policy", [id]), {
    [id]: "CONTINUE",
  });
});
