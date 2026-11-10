import assert from "node:assert/strict";
import { test } from "node:test";
import type { AppLoadContext } from "react-router";
import {
  changeThemivoList,
  checkThemivoPost,
  readThemivoHearts,
  readThemivoProductCount,
  readThemivoShared,
  ThemivoError,
  themivoEnabled,
  toggleThemivoHeart,
  transferThemivoCartItem,
} from "../app/utils/themivo-wishlist.server.ts";

const productId = "gid://shopify/Product/632910392";
const guest = "10000000-0000-4000-8000-000000000001";
const defaultList = { id: "l_default", isDefault: true, role: "owner" };
const snapshot = {
  lists: [defaultList],
  items: [{ listId: "l_default", productId: "632910392", variantId: "" }],
};
const rules = { hideButton: ["1234"], hidePrice: ["632910392"] };

function context(key?: string, customer = false, guestId?: string) {
  const session = new Map<string, string>();
  if (guestId) {
    session.set("themivoGuest", guestId);
  }
  return {
    env: { WISHLIST_API_KEY: key },
    session: {
      get: session.get.bind(session),
      set: session.set.bind(session),
      unset: session.delete.bind(session),
    },
    customerAccount: {
      isLoggedIn: async () => customer,
      query: async () => ({
        data: { customer: { id: "gid://shopify/Customer/9001" } },
      }),
    },
  } as unknown as AppLoadContext;
}

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) {
    result.set(key, value);
  }
  return result;
}

test("missing or blank secret keeps the native provider selected", () => {
  assert.equal(themivoEnabled(context()), false);
  assert.equal(themivoEnabled(context(" ")), false);
  assert.equal(themivoEnabled(context("test")), true);
});

test("guest first save, duplicate save and remove use the signed session identity", async (t) => {
  const ctx = context("guest-key");
  const request = t.mock.method(
    globalThis,
    "fetch",
    async (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      assert.equal(headers.get("Authorization"), "Bearer guest-key");
      assert.ok(url.includes(String(ctx.session.get("themivoGuest"))));
      const otherItems = [
        { listId: "l_default", productId: "632910392", variantId: "123" },
        { listId: "l_custom", productId: "632910392", variantId: "" },
      ];
      const lists = [
        defaultList,
        { id: "l_custom", isDefault: false, role: "owner" },
      ];
      if (url.endsWith("/wishlist")) {
        assert.equal(init.method, "GET");
        return Response.json({
          lists,
          items: [...snapshot.items, ...otherItems],
        });
      }

      assert.match(
        url,
        /^https:\/\/wishlist-edge\.themivo\.com\/api\/v1\/guests\/[0-9a-f-]{36}\/items$/,
      );
      const removing = init.method === "DELETE";
      assert.deepEqual(
        JSON.parse(String(init.body)),
        removing
          ? { productId: "632910392", listId: "l_default", variantId: "" }
          : { productId: "632910392" },
      );
      return Response.json({
        changed: removing,
        state: removing ? { lists, items: otherItems } : snapshot,
      });
    },
  );

  assert.deepEqual(
    (await toggleThemivoHeart(ctx, productId, "add")).productIds,
    [productId],
  );
  assert.deepEqual(
    (await toggleThemivoHeart(ctx, productId, "add")).productIds,
    [productId],
  );
  const removed = await toggleThemivoHeart(ctx, productId, "remove");
  assert.deepEqual(removed.productIds, []);
  assert.equal(removed.savedProductCount, 2);
  assert.equal(request.mock.callCount(), 4);
});

test("parallel reads share the snapshot and the next request uses its ETag", async (t) => {
  let reads = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/rules")) {
      return Response.json(rules);
    }
    assert.match(url, /\/customers\/9001\/wishlist$/);
    const etag = new Headers(init.headers).get("If-None-Match");
    reads += 1;
    if (reads === 2) {
      assert.equal(etag, '"snapshot-1"');
      return new Response(null, { status: 304 });
    }
    assert.equal(etag, null);
    return Response.json(snapshot, { headers: { ETag: '"snapshot-1"' } });
  });

  const first = context("etag-key", true);
  const [left, right] = await Promise.all([
    readThemivoHearts(first),
    readThemivoHearts(first),
  ]);
  assert.deepEqual(left, right);
  assert.equal(reads, 1);
  assert.deepEqual(left.hiddenProductIds, ["gid://shopify/Product/1234"]);
  assert.deepEqual(
    (await readThemivoHearts(context("etag-key", true))).productIds,
    [productId],
  );
  assert.equal(reads, 2);
});

test("a failed sign-in merge retains the guest ID and a successful retry consumes it", async (t) => {
  let merges = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/rules")) {
      return Response.json(rules);
    }
    if (url.endsWith("/merge")) {
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(String(init.body)), { guestId: guest });
      merges += 1;
      return merges === 1
        ? new Response(null, { status: 503 })
        : Response.json({ state: snapshot });
    }
    assert.equal(merges, 2);
    return Response.json(snapshot);
  });

  const failure = context("merge-key", true, guest);
  assert.equal(
    (await readThemivoHearts(failure)).error,
    "errors.wishlistUnavailable",
  );
  assert.equal(failure.session.get("themivoGuest"), guest);
  const retry = context("merge-key", true, guest);
  assert.deepEqual((await readThemivoHearts(retry)).productIds, [productId]);
  assert.equal(retry.session.get("themivoGuest"), undefined);
});

test("rate limiting honors Retry-After and a cross-origin write is rejected", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: { code: "rate_limited" } },
      { status: 429, headers: { "Retry-After": "8" } },
    ),
  );
  const ctx = context("rate-key", true);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(
      toggleThemivoHeart(ctx, productId, "add"),
      (error) =>
        error instanceof ThemivoError &&
        error.code === "rate_limited" &&
        error.retryAfter === "8",
    );
  }
  assert.equal(request.mock.callCount(), 1);
  assert.throws(
    () =>
      checkThemivoPost(
        new Request("https://aspen.example/api/wishlist", {
          method: "POST",
          headers: { Origin: "https://other.example" },
        }),
      ),
    ThemivoError,
  );
});

test("list operations are scoped to the session shopper and public shares only expose list data", async (t) => {
  const responses = [
    ["/customers/9001/lists", "POST", { name: "Living room" }, {}],
    ["/customers/9001/lists/l_1", "PATCH", { name: "Bedroom" }, {}],
    [
      "/customers/9001/items/move",
      "POST",
      {
        productId: "632910392",
        variantId: "",
        fromListId: "l_1",
        toListId: "l_2",
      },
      {},
    ],
    [
      "/customers/9001/items",
      "DELETE",
      { productId: "632910392", variantId: "", listId: "l_1" },
      {},
    ],
    [
      "/customers/9001/lists/l_1/share",
      "POST",
      undefined,
      { token: "abc", url: "https://online.example" },
    ],
    ["/customers/9001/lists/l_1/share", "DELETE", undefined, {}],
    [
      "/customers/9001/lists/l_1/invites",
      "POST",
      undefined,
      { token: "invite" },
    ],
    ["/customers/9001/invites/invite/accept", "POST", undefined, {}],
    ["/customers/9001/lists/l_1/leave", "POST", undefined, {}],
    ["/customers/9001/lists/l_1", "DELETE", undefined, {}],
    [
      "/shared/abc?limit=24",
      "GET",
      undefined,
      {
        list: { name: "Bedroom" },
        items: { items: snapshot.items, nextCursor: null },
      },
    ],
  ];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/rules")) {
      return Response.json(rules);
    }
    const expected = responses.shift();
    assert.ok(expected);
    const [path, method, body, response] = expected;
    assert.equal(url, `https://wishlist-edge.themivo.com/api/v1${path}`);
    assert.equal(init.method, method);
    assert.deepEqual(
      init.body ? JSON.parse(String(init.body)) : undefined,
      body,
    );
    return Response.json(response);
  });

  const ctx = context("lists-key", true);
  const run = (intent: string, fields: Record<string, string> = {}) =>
    changeThemivoList(
      ctx,
      form({ intent, listId: "l_1", customerId: "ignored", ...fields }),
    );
  await run("create", { name: "Living room" });
  await run("rename", { name: "Bedroom" });
  await run("move", { productId, toListId: "l_2" });
  await run("remove", { productId });
  assert.deepEqual(await run("share"), { shareToken: "abc", listId: "l_1" });
  await run("revoke");
  assert.deepEqual(await run("invite"), {
    inviteToken: "invite",
    listId: "l_1",
  });
  await run("accept", { token: "invite" });
  await run("leave");
  await run("delete");
  assert.deepEqual(
    (await readThemivoShared(ctx, "abc", null)).page.items,
    snapshot.items,
  );
  assert.equal(responses.length, 0);
  await assert.rejects(
    changeThemivoList(
      context("lists-key", false, guest),
      form({ intent: "create", name: "Guest list" }),
    ),
    (error) => error instanceof ThemivoError && error.code === "login_required",
  );
  await assert.rejects(
    changeThemivoList(
      context("lists-key", false, guest),
      form({ intent: "accept", token: "invite" }),
    ),
    (error) => error instanceof ThemivoError && error.code === "login_required",
  );
});

test("a signed-out shopper with no session guest makes no wishlist request", async (t) => {
  const ctx = context("signed-out-key");
  const request = t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.ok(url.endsWith("/rules"));
    return Response.json(rules);
  });
  const result = await readThemivoHearts(ctx);
  assert.equal(result.authenticated, false);
  assert.equal(result.acceptsGuests, true);
  assert.deepEqual(result.productIds, []);
  assert.equal(ctx.session.get("themivoGuest"), undefined);
  assert.equal(request.mock.callCount(), 1);
});

test("feature and access errors remain distinguishable from an outage", async (t) => {
  const failures = [
    { code: "feature_disabled", status: 403 },
    { code: "forbidden", status: 403 },
    { code: "login_required", status: 401 },
  ];
  t.mock.method(globalThis, "fetch", async () => {
    const failure = failures.shift();
    if (!failure) {
      throw new Error("Network unavailable");
    }
    return Response.json(
      { error: { code: failure.code } },
      { status: failure.status },
    );
  });
  const ctx = context("error-key", false, guest);
  for (const code of [
    "feature_disabled",
    "forbidden",
    "login_required",
    "unavailable",
  ]) {
    await assert.rejects(
      toggleThemivoHeart(ctx, productId, "add"),
      (error) => error instanceof ThemivoError && error.code === code,
    );
  }
  assert.equal(ctx.session.get("themivoGuest"), guest);
});

test("variant writes use the exact variant and default wishlist; product counts come from stats", async (t) => {
  const variantId = "gid://shopify/ProductVariant/123";
  const savedVariant = {
    listId: "l_default",
    productId: "632910392",
    variantId: "123",
  };
  const savedCart = {
    id: "l_cart",
    kind: "saved_for_later",
    isDefault: false,
    role: "owner",
  };
  const savedState = {
    lists: [...snapshot.lists, savedCart],
    items: [
      ...snapshot.items,
      savedVariant,
      { ...savedVariant, variantId: "456" },
      { listId: savedCart.id, productId: "99", variantId: "111" },
    ],
  };
  let statsReads = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/stats")) {
      statsReads += 1;
      return Response.json({ count: 7 });
    }
    if (url.endsWith("/wishlist")) {
      return Response.json(savedState);
    }
    if (init.method === "POST") {
      assert.deepEqual(JSON.parse(String(init.body)), {
        productId: "632910392",
        variantId: "123",
      });
      return Response.json({ changed: true, state: savedState });
    }
    assert.equal(init.method, "DELETE");
    assert.deepEqual(JSON.parse(String(init.body)), {
      productId: "632910392",
      variantId: "123",
      listId: "l_default",
    });
    return Response.json({ state: snapshot });
  });
  const ctx = context("variant-key", false, guest);
  const saved = await toggleThemivoHeart(ctx, productId, "add", variantId);
  assert.deepEqual(saved.savedVariantIds, [
    variantId,
    "gid://shopify/ProductVariant/456",
  ]);
  assert.deepEqual(saved.productIds, [productId]);
  assert.equal(saved.savedProductCount, 3);
  assert.equal(await readThemivoProductCount(ctx, productId), 7);
  const removed = await toggleThemivoHeart(ctx, productId, "remove", variantId);
  assert.deepEqual(removed.savedVariantIds, []);
  assert.deepEqual(removed.productIds, [productId]);
  assert.equal(await readThemivoProductCount(ctx, productId), 7);
  assert.equal(statsReads, 2);
});

test("product counts are cached by key and product and use a bounded upstream budget", async (t) => {
  const fetchCount = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ count: 7 }),
  );
  const ctx = context("product-count-key");
  assert.equal(await readThemivoProductCount(ctx, productId), 7);
  assert.equal(
    await readThemivoProductCount(context("product-count-key"), productId),
    7,
  );
  assert.equal(fetchCount.mock.callCount(), 1);
  for (let index = 1; index < 40; index += 1) {
    assert.equal(
      await readThemivoProductCount(ctx, `gid://shopify/Product/${index}`),
      7,
    );
  }
  assert.equal(
    await readThemivoProductCount(ctx, "gid://shopify/Product/40"),
    null,
  );
  assert.equal(await readThemivoProductCount(ctx, productId), 7);
  assert.equal(fetchCount.mock.callCount(), 40);
  assert.equal(
    await readThemivoProductCount(
      context("other-product-count-key"),
      productId,
    ),
    7,
  );
  assert.equal(fetchCount.mock.callCount(), 41);
});

test("save retries one line even after a different line has been saved", async (t) => {
  const ctx = context("cart-save-key", false, guest);
  const line = {
    id: "cart-line",
    quantity: 2,
    merchandise: {
      id: "gid://shopify/ProductVariant/123",
      product: { id: productId },
    },
  };
  const secondLine = {
    ...line,
    id: "cart-line-2",
    merchandise: {
      ...line.merchandise,
      id: "gid://shopify/ProductVariant/124",
    },
  };
  let lines = [line, secondLine];
  const cart = () => ({ id: "cart", lines: { nodes: lines } });
  const saved: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }> = [];
  let listCreated = false;
  const removal = t.mock.fn(async ([id]: string[]) => {
    const variant = id === line.id ? "123" : "124";
    assert.ok(saved.some(({ variantId }) => variantId === variant));
    if (removal.mock.callCount() === 0) {
      return { cart: cart(), userErrors: [{ message: "Retry" }] };
    }
    lines = lines.filter((item) => item.id !== id);
    return { cart: cart() };
  });
  Object.assign(ctx, {
    cart: { get: async () => cart(), removeLines: removal },
  });
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/rules")) {
      return Response.json(rules);
    }
    if (url.endsWith("/lists") && init.method === "GET") {
      return Response.json({
        lists: listCreated
          ? [
              {
                id: "l_cart",
                kind: "saved_for_later",
                role: "owner",
                items: saved,
              },
            ]
          : [],
      });
    }
    if (url.endsWith("/lists")) {
      assert.deepEqual(JSON.parse(String(init.body)), {
        name: "Saved for later",
        kind: "saved_for_later",
      });
      listCreated = true;
      return Response.json({ listId: "l_cart" });
    }
    const variant = saved.length ? "124" : "123";
    assert.deepEqual(JSON.parse(String(init.body)), {
      listId: "l_cart",
      productId: "632910392",
      variantId: variant,
      quantity: 2,
    });
    assert.ok(!saved.some(({ variantId }) => variantId === variant));
    saved.push({ productId: "632910392", variantId: variant, quantity: 2 });
    return Response.json({ changed: true });
  });
  const save = (lineId = line.id) =>
    transferThemivoCartItem(ctx, "save", form({ lineId }));
  await assert.rejects(
    save,
    (error) =>
      error instanceof ThemivoError &&
      error.code === "cart_transfer_incomplete",
  );
  assert.deepEqual((await save(secondLine.id)).cart?.lines?.nodes, [line]);
  assert.deepEqual((await save()).cart?.lines?.nodes, []);
  assert.equal(saved.length, 2);
  assert.equal(removal.mock.callCount(), 3);
});

test("restore fills a partial cart line and retries cleanup without adding it twice", async (t) => {
  const ctx = context("cart-restore-key", false, guest);
  const variantId = "gid://shopify/ProductVariant/123";
  let lines: Array<{
    id?: string;
    quantity: number;
    attributes: Array<{ key: string; value: string }>;
  }> = [];
  const cart = () => ({ id: "cart", lines: { nodes: lines } });
  const addLines = t.mock.fn(async (items: typeof lines) => {
    assert.equal(items[0].quantity, 2);
    lines = items.map((item) => ({ ...item, id: "line", quantity: 1 }));
    return { cart: cart() };
  });
  const updateLines = t.mock.fn(
    async (items: Array<{ id: string; quantity: number }>) => {
      assert.deepEqual(items, [{ id: "line", quantity: 2 }]);
      lines = lines.map((line) => ({ ...line, quantity: 2 }));
      return { cart: cart() };
    },
  );
  Object.assign(ctx, {
    cart: { get: async () => cart(), addLines, updateLines },
  });
  let cleanups = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/lists")) {
      return Response.json({
        lists: [
          {
            id: "l_cart",
            kind: "saved_for_later",
            role: "owner",
            items: [
              {
                productId: "632910392",
                variantId: "123",
                quantity: 2,
                addedAt: 123456,
              },
            ],
          },
        ],
      });
    }
    assert.equal(init.method, "DELETE");
    assert.deepEqual(JSON.parse(String(init.body)), {
      listId: "l_cart",
      productId: "632910392",
      variantId: "123",
    });
    cleanups += 1;
    return cleanups === 1
      ? new Response(null, { status: 503 })
      : Response.json({ changed: true });
  });
  const restore = () =>
    transferThemivoCartItem(ctx, "restore", form({ productId, variantId }));
  assert.equal(
    (await restore()).wishlistError,
    "wishlist.cartTransferIncomplete",
  );
  assert.equal(cleanups, 0);
  assert.equal(lines[0]?.quantity, 1);
  assert.equal(
    (await restore()).wishlistError,
    "wishlist.cartTransferIncomplete",
  );
  assert.equal(lines[0]?.quantity, 2);
  assert.equal((await restore()).wishlistError, undefined);
  assert.equal(updateLines.mock.callCount(), 1);
  assert.equal(cleanups, 2);
  assert.equal(addLines.mock.callCount(), 1);
});
