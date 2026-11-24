import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryCache } from "./helpers/cache";
import type { AppLoadContext } from "react-router";
import { readThemivoAppearance } from "../app/utils/themivo-appearance.server";
import { action } from "../app/routes/($locale).api.wishlist";

function fixture(customer = false) {
  const pending: Promise<unknown>[] = [];
  const session = new Map();
  const context = {
    cache: new InMemoryCache(),
    waitUntil: (p: Promise<unknown>) => pending.push(p),
    env: {
      WISHLIST_API_KEY: "test-key",
      PUBLIC_STORE_DOMAIN: "appearance.myshopify.com",
    },
    storefront: { i18n: { language: "EN", country: "US" } },
    customerAccount: {
      isLoggedIn: async () => customer,
      graphql: async () => ({
        data: { customer: { id: "gid://shopify/Customer/9001" } },
      }),
    },
    session: {
      get: session.get.bind(session),
      set: session.set.bind(session),
      unset: session.delete.bind(session),
    },
  } as unknown as AppLoadContext;
  return {
    context,
    session,
    flush: async () => {
      await Promise.all(pending.splice(0));
    },
  };
}

test("Appearance failures share a short cache across reader instances and retry after expiry", async (t) => {
  const f = fixture();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return new Response(null, { status: 503 });
  });
  const read = (
    context: Pick<AppLoadContext, "cache" | "waitUntil"> = f.context,
  ) =>
    readThemivoAppearance(
      "outage.myshopify.com",
      "https://aspen.test",
      { language: "EN", country: "US" },
      context,
    );
  assert.equal(await read(), null);
  await f.flush();
  assert.equal(await read({ ...f.context }), null);
  assert.equal(calls, 1);
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 6000);
  assert.equal(await read(), null);
  await f.flush();
  assert.equal(calls, 2);
});

test("Appearance cache separates store, storefront origin and language", async (t) => {
  const f = fixture();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return Response.json({
      config: { style: { icon: "star" }, features: { guestWishlist: false } },
      i18n: {},
    });
  });
  const read = (
    shop = "shop.myshopify.com",
    origin = "https://aspen.test",
    language = "EN",
  ) =>
    readThemivoAppearance(shop, origin, { language, country: "US" }, f.context);
  assert.equal((await read())?.icon, "star");
  await f.flush();
  assert.equal((await read())?.guestWishlist, false);
  assert.equal(calls, 1);
  await read("other.myshopify.com");
  await f.flush();
  await read(undefined, "https://other.test");
  await f.flush();
  await read(undefined, undefined, "FR");
  await f.flush();
  assert.equal(calls, 4);
});

test("direct anonymous heart POST cannot create a guest when guest wishlists are disabled", async (t) => {
  const f = fixture();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls += 1;
    assert.match(String(url), /\/config/);
    return Response.json({ config: { features: { guestWishlist: false } } });
  });
  const request = new Request("https://aspen.test/api/wishlist", {
    method: "POST",
    headers: { Origin: "https://aspen.test" },
    body: new URLSearchParams({
      intent: "add",
      productId: "gid://shopify/Product/123",
    }),
  });
  const response = await action({
    request,
    context: f.context,
    params: {},
  } as Parameters<typeof action>[0]);
  assert.equal(response.init?.status, 401);
  assert.equal(response.data.loginRequired, true);
  assert.equal(f.session.size, 0);
  assert.equal(calls, 1);
  await f.flush();
});

test("disabling guests does not prevent signed-in customer heart writes", async (t) => {
  const f = fixture(true);
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).includes("/config")) {
      return Response.json({ config: { features: { guestWishlist: false } } });
    }
    assert.match(String(url), /customers\/9001\/items$/);
    assert.equal(init?.method, "POST");
    writes += 1;
    return Response.json({
      state: {
        lists: [{ id: "default", isDefault: true, role: "owner" }],
        items: [{ listId: "default", productId: "123", variantId: "" }],
      },
    });
  });
  const request = new Request("https://aspen.test/api/wishlist", {
    method: "POST",
    headers: { Origin: "https://aspen.test" },
    body: new URLSearchParams({
      intent: "add",
      productId: "gid://shopify/Product/123",
    }),
  });
  const response = await action({
    request,
    context: f.context,
    params: {},
  } as Parameters<typeof action>[0]);
  assert.equal(response.data.authenticated, true);
  assert.equal(writes, 1);
  assert.deepEqual(response.data.productIds, ["gid://shopify/Product/123"]);
  await f.flush();
});

function heartRequest(intent = "add") {
  return new Request("https://aspen.test/api/wishlist", {
    method: "POST",
    headers: { Origin: "https://aspen.test" },
    body: new URLSearchParams({
      intent,
      productId: "gid://shopify/Product/123",
    }),
  });
}

for (const failure of ["503", "timeout", "invalid-json"]) {
  test(`anonymous add fails closed on config ${failure} without creating a guest`, async (t) => {
    const f = fixture();
    let calls = 0;
    t.mock.method(globalThis, "fetch", async (url) => {
      calls += 1;
      assert.match(String(url), /\/config/);
      if (failure === "timeout") {
        throw new DOMException("Timed out", "TimeoutError");
      }
      return failure === "503"
        ? new Response(null, { status: 503 })
        : new Response("invalid");
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await action({
        request: heartRequest(),
        context: f.context,
        params: {},
      } as Parameters<typeof action>[0]);
      assert.equal(response.init?.status, 503);
      assert.equal(response.data.loginRequired, false);
      assert.equal(f.session.size, 0);
      await f.flush();
    }
    assert.equal(calls, 1, "Repeated failures should use the negative cache");
  });
}

test("guest add resumes after the config recovers and its negative cache expires", async (t) => {
  const f = fixture();
  let recovered = false,
    writes = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).includes("/config")) {
      return recovered
        ? Response.json({ config: { features: { guestWishlist: true } } })
        : new Response(null, { status: 503 });
    }
    assert.match(String(url), /\/guests\/[a-f0-9-]+\/items$/);
    assert.equal(init?.method, "POST");
    writes += 1;
    return Response.json({
      state: {
        lists: [{ id: "default", isDefault: true, role: "owner" }],
        items: [{ listId: "default", productId: "123", variantId: "" }],
      },
    });
  });
  const args = () =>
    ({ request: heartRequest(), context: f.context, params: {} }) as Parameters<
      typeof action
    >[0];
  assert.equal((await action(args())).init?.status, 503);
  await f.flush();
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 6000);
  recovered = true;
  const result = await action(args());
  assert.equal(result.init?.status, 200);
  assert.equal(writes, 1);
  assert.equal(f.session.has("themivoGuest"), true);
  await f.flush();
});

test("signed-in adds and existing guest removals do not depend on config availability", async (t) => {
  const snapshot = {
    lists: [{ id: "default", isDefault: true, role: "owner" }],
    items: [{ listId: "default", productId: "123", variantId: "" }],
  };
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.doesNotMatch(String(url), /\/config/);
    if (String(url).endsWith("/wishlist")) {
      return Response.json(snapshot);
    }
    writes += 1;
    return Response.json({
      state: init?.method === "DELETE" ? { ...snapshot, items: [] } : snapshot,
    });
  });
  const customer = fixture(true);
  assert.equal(
    (
      await action({
        request: heartRequest(),
        context: customer.context,
        params: {},
      } as Parameters<typeof action>[0])
    ).data.authenticated,
    true,
  );
  const guest = fixture();
  guest.session.set("themivoGuest", "10000000-0000-4000-8000-000000000001");
  const removed = await action({
    request: heartRequest("remove"),
    context: guest.context,
    params: {},
  } as Parameters<typeof action>[0]);
  assert.equal(removed.init?.status, 200);
  assert.deepEqual(removed.data.productIds, []);
  assert.equal(writes, 2);
});
