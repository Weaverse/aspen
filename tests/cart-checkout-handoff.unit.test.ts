import assert from "node:assert/strict";
import test from "node:test";
import { handleShopifyRoutes } from "@shopify/hydrogen";
import type { Fetcher } from "react-router";
import { getCartHandlers } from "../app/.server/cart";
import { createAspenCart } from "../app/.server/cart-gateway";
import { getCustomerSession } from "../app/.server/customer-account";
import { AppSession } from "../app/.server/session";
import { createRequestStorefront } from "../app/.server/storefront";
import {
  clearFreshestFetcherCart,
  resolveBaselineCart,
} from "../app/components/cart/cart-baseline";
import { InMemoryCache } from "./helpers/cache";

const env = {
  SHOP_ID: "222222",
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: "checkout-test",
  PUBLIC_STORE_DOMAIN: "store.example",
} as Env;
for (const token of ["signed-in-token", null, undefined]) {
  test(`gateway preserves checkout handoff; token=${String(token)}`, async () => {
    const request = new Request("https://store.example/fr-fr/cart", {
      headers: { Cookie: "cart=test?key=secret" },
    });
    const original = {
      id: "gid://shopify/Cart/test",
      checkoutUrl: "https://checkout.example/cart?key=secret&locale=fr",
    };
    const storefront = {
      graphql: async () => ({ data: { cart: original } }),
    } as unknown as Parameters<typeof createAspenCart>[0]["storefront"];
    let reads = 0;
    const cart = createAspenCart({
      request,
      storefront,
      getCustomerAccessToken: async () => {
        reads += 1;
        return token;
      },
    });
    const result = await cart.get();
    assert.ok(result);
    const url = new URL(result.checkoutUrl);
    assert.equal(url.searchParams.get("logged_in"), token ? "true" : null);
    assert.equal(url.searchParams.get("locale"), "fr");
    assert.equal(url.searchParams.get("key"), "secret");
    assert.equal(reads, 1);
    assert.equal(
      new URL(original.checkoutUrl).searchParams.has("logged_in"),
      false,
    );
  });
}
for (const loggedIn of [true, false]) {
  test(`/api/cart uses the shared customer session; loggedIn=${loggedIn}`, async (t) => {
    const request = new Request("https://store.example/api/cart", {
      headers: { Cookie: "cart=test?key=secret" },
    });
    const session = await AppSession.init(request, [
      "checkout-regression-secret",
    ]);
    const storefront = createRequestStorefront({
      request,
      env,
      cache: new InMemoryCache(),
      waitUntil: () => undefined,
    });
    t.mock.method(storefront, "graphql", async () => ({
      data: {
        cart: {
          id: "gid://shopify/Cart/test",
          checkoutUrl: "https://checkout.example/cart?locale=fr",
        },
      },
      headers: new Headers(),
    }));
    const account = getCustomerSession(env);
    assert.ok(account);
    const customer = account.session;
    const check = t.mock.method(customer, "isLoggedIn", async () => loggedIn);
    const response = await handleShopifyRoutes({
      request,
      requestContext: storefront.requestContext,
      storefrontClient: storefront,
      sessionManager: session,
      handlers: [getCartHandlers(env)],
    });
    assert.ok(response);
    const body = (await response.json()) as { cart: { checkoutUrl: string } };
    assert.equal(
      new URL(body.cart.checkoutUrl).searchParams.get("logged_in"),
      loggedIn ? "true" : null,
    );
    assert.equal(check.mock.callCount(), 1);
    assert.match(response.headers.get("Cache-Control") ?? "", /private/);
  });
}

type Gateway = ReturnType<typeof createAspenCart>;
const mutations: [
  string,
  (cart: Gateway) => ReturnType<Gateway["updateNote"]>,
][] = [
  ["create", (cart) => cart.create({ lines: [] })],
  [
    "addLines",
    (cart) =>
      cart.addLines([
        { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 },
      ]),
  ],
  [
    "updateLines",
    (cart) =>
      cart.updateLines([{ id: "gid://shopify/CartLine/1", quantity: 2 }]),
  ],
  ["removeLines", (cart) => cart.removeLines(["gid://shopify/CartLine/1"])],
  ["updateDiscountCodes", (cart) => cart.updateDiscountCodes(["TEST"])],
  ["updateNote", (cart) => cart.updateNote("Leave at the door")],
  [
    "updateBuyerIdentity",
    (cart) => cart.updateBuyerIdentity({ countryCode: "FR" }),
  ],
  ["addGiftCardCodes", (cart) => cart.addGiftCardCodes(["gift-code"])],
  [
    "removeGiftCardCodes",
    (cart) => cart.removeGiftCardCodes(["gid://shopify/AppliedGiftCard/1"]),
  ],
];

function mutationFixture(
  token: string | null | undefined | (() => Promise<string | null | undefined>),
) {
  const original = {
    id: "gid://shopify/Cart/test",
    updatedAt: "2026-11-23T00:00:01Z",
    checkoutUrl:
      "https://checkout.example/cart?key=secret&locale=fr&channel=headless",
    lines: { nodes: [] },
    totalQuantity: 0,
  };
  const payload = { cart: original, userErrors: [], warnings: [] };
  const request = new Request("https://store.example/fr-fr/cart", {
    headers: { Cookie: "cart=test?key=secret" },
  });
  const storefront = {
    i18n: { country: "FR", language: "FR" },
    graphql: async () => ({
      data: {
        cart: original,
        cartCreate: payload,
        cartBuyerIdentityUpdate: payload,
        cartLinesAdd: payload,
        cartLinesUpdate: payload,
        cartLinesRemove: payload,
        cartDiscountCodesUpdate: payload,
        cartNoteUpdate: payload,
        cartGiftCardCodesAdd: payload,
        cartGiftCardCodesRemove: payload,
      },
      headers: new Headers(),
    }),
  } as unknown as Parameters<typeof createAspenCart>[0]["storefront"];
  const gateway = createAspenCart({
    request,
    storefront,
    getCustomerAccessToken:
      typeof token === "function" ? token : async () => token,
  });
  return { gateway, original };
}

for (const [name, mutate] of mutations) {
  for (const token of ["signed-in-token", null]) {
    test(`${name} preserves the checkout handoff; token=${String(token)}`, async () => {
      const { gateway, original } = mutationFixture(token);

      const result = await mutate(gateway);

      assert.ok(result.cart);
      const url = new URL(result.cart.checkoutUrl);
      assert.equal(url.searchParams.get("logged_in"), token ? "true" : null);
      assert.equal(url.searchParams.get("locale"), "fr");
      assert.equal(url.searchParams.get("key"), "secret");
      assert.equal(url.searchParams.get("channel"), "headless");
      assert.deepEqual(result.userErrors, []);
      assert.equal(
        new URL(original.checkoutUrl).searchParams.has("logged_in"),
        false,
      );
    });
  }
}

test("a transient customer session still prevents queued cart mutations", async () => {
  const { gateway } = mutationFixture(undefined);

  const result = await gateway.updateNote("Leave at the door");

  assert.equal(result.cart, undefined);
  assert.deepEqual(result.errors, [{ message: "errors.generic" }]);
});

test("a signed-in note mutation keeps the checkout handoff in the UI baseline", async (t) => {
  clearFreshestFetcherCart();
  t.after(clearFreshestFetcherCart);
  const { gateway } = mutationFixture("signed-in-token");
  const initial = await gateway.get();
  const result = await gateway.updateNote("Leave at the door");

  const baseline = resolveBaselineCart(initial, [
    { state: "loading", data: result } as Fetcher<unknown>,
  ]);

  assert.equal(baseline.cart, result.cart);
  assert.equal(
    new URL(baseline.cart.checkoutUrl).searchParams.get("logged_in"),
    "true",
  );
});

for (const name of [
  "updateBuyerIdentity",
  "addGiftCardCodes",
  "removeGiftCardCodes",
]) {
  const mutate = mutations.find(([operation]) => operation === name)[1];
  test(`${name} leaves checkout anonymous when the customer session is unavailable`, async () => {
    const { gateway } = mutationFixture(undefined);

    const result = await mutate(gateway);

    assert.ok(result.cart);
    assert.equal(
      new URL(result.cart.checkoutUrl).searchParams.has("logged_in"),
      false,
    );
  });
}

for (const [name, mutate] of mutations) {
  test(`${name} reuses its authenticated token without another account lookup`, async () => {
    let reads = 0;
    const { gateway } = mutationFixture(async () => {
      reads += 1;
      if (reads > 1) {
        throw new Error("temporary account failure");
      }
      return "signed-in-token";
    });

    const result = await mutate(gateway);

    assert.ok(result.cart);
    assert.equal(
      new URL(result.cart.checkoutUrl).searchParams.get("logged_in"),
      "true",
    );
    assert.equal(reads, 1);
  });
}

test("a note mutation does not lose authenticated handoff to a later transient lookup", async () => {
  let reads = 0;
  const { gateway } = mutationFixture(async () => {
    reads += 1;
    return reads === 1 ? "signed-in-token" : undefined;
  });

  const result = await gateway.updateNote("Leave at the door");

  assert.ok(result.cart);
  assert.equal(
    new URL(result.cart.checkoutUrl).searchParams.get("logged_in"),
    "true",
  );
  assert.equal(reads, 1);
});

for (const existing of [true, false]) {
  test(`add synchronizes identity without a redundant round trip; existing=${existing}`, async () => {
    const request = new Request(
      "https://store.example/cart",
      existing ? { headers: { Cookie: "cart=test?key=secret" } } : undefined,
    );
    let syncs = 0,
      writes = 0;
    const cart = {
      id: "gid://shopify/Cart/test",
      checkoutUrl: "https://checkout.example/cart?key=secret",
      lines: { nodes: [] },
      totalQuantity: 1,
    };
    const syncedCart = { ...cart, totalQuantity: 2 };
    const storefront = {
      i18n: { country: "FR", language: "FR" },
      graphql: async (doc) => {
        const sync = String(doc).includes("mutation AspenCartBuyer");
        if (sync) {
          syncs += 1;
          return {
            data: {
              cartBuyerIdentityUpdate: { cart: syncedCart, userErrors: [] },
            },
          };
        }
        writes += 1;
        return {
          data: {
            cartCreate: { cart, userErrors: [] },
            cartLinesAdd: { cart, userErrors: [] },
          },
          headers: new Headers(),
        };
      },
    } as unknown as Parameters<typeof createAspenCart>[0]["storefront"];
    const gateway = createAspenCart({
      request,
      storefront,
      getCustomerAccessToken: async () => "token",
    });
    const result = await gateway.addLines([
      { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 },
    ]);
    assert.equal(syncs, 1);
    assert.equal(writes, 1);
    assert.equal(result.cart.totalQuantity, existing ? 1 : 2);
    assert.equal(
      new URL(result.cart.checkoutUrl).searchParams.get("logged_in"),
      "true",
    );
  });
}
