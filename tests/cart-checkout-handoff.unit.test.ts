import assert from "node:assert/strict";
import test from "node:test";
import { handleShopifyRoutes } from "@shopify/hydrogen";
import { getCartHandlers } from "../app/.server/cart";
import { createAspenCart } from "../app/.server/cart-gateway";
import { getCustomerSession } from "../app/.server/customer-account";
import { AppSession } from "../app/.server/session";
import { createRequestStorefront } from "../app/.server/storefront";
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
