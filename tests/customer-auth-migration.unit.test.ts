import assert from "node:assert/strict";
import test from "node:test";
import { handleShopifyRoutes } from "@shopify/hydrogen";
import { createAspenCart } from "../app/.server/cart-gateway";
import { getCustomerAccountHandlers } from "../app/.server/customer-account";
import { AppSession } from "../app/.server/session";
import { createRequestStorefront } from "../app/.server/storefront";
import { InMemoryCache } from "./helpers/cache";

const env = {
  SHOP_ID: "111111",
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: "migration-test-client",
  PUBLIC_STORE_DOMAIN: "store.example",
} as Env;
const origin = "https://store.example";
const secret = "customer-migration-test-secret-32-characters";
async function fixture(path: string, init?: RequestInit, config: Env = env) {
  const request = new Request(origin + path, init);
  const session = await AppSession.init(request, [secret]);
  const storefront = createRequestStorefront({
    request,
    env: config,
    cache: new InMemoryCache(),
    waitUntil: () => undefined,
  });
  const calls: Array<Record<string, unknown>> = [];
  Object.defineProperty(storefront, "graphql", {
    configurable: true,
    value: async (
      _doc: unknown,
      options: { variables: Record<string, unknown> },
    ) => {
      calls.push(options.variables);
      return {
        data: {
          cartBuyerIdentityUpdate: {
            cart: { id: "gid://shopify/Cart/test" },
            userErrors: [],
          },
          cartLinesUpdate: {
            cart: { id: "gid://shopify/Cart/test" },
            userErrors: [],
            warnings: [],
          },
        },
        headers: new Headers(),
      };
    },
  });
  const route = () =>
    handleShopifyRoutes({
      request,
      requestContext: storefront.requestContext,
      storefrontClient: storefront,
      sessionManager: session,
      handlers: [getCustomerAccountHandlers(config)],
    });
  return { request, session, storefront, calls, route };
}

test("OAuth login keeps PKCE, signed cookies, language and same-origin return paths", async () => {
  const f = await fixture("/account/login?return_to=/fr-fr/account&locale=fr");
  const response = await f.route();
  assert.equal(response.status, 303);
  const url = new URL(response.headers.get("Location"));
  assert.equal(
    url.searchParams.get("redirect_uri"),
    origin + "/account/authorize",
  );
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("locale"), "fr");
  assert.ok(url.searchParams.get("state"));
  assert.match(response.headers.get("Set-Cookie"), /HttpOnly/);
  assert.match(response.headers.get("Set-Cookie"), /Secure/);
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  const pending = f.session.get("customerAccount") as {
    pendingLogin: { returnTo: string };
  };
  assert.equal(pending.pendingLogin.returnTo, "/fr-fr/account");
  const external = await fixture(
    "/account/login?return_to=https://other.example/",
  );
  await external.route();
  assert.equal(
    (external.session.get("customerAccount") as typeof pending).pendingLogin
      .returnTo,
    "/account",
  );
});

test("logout clears customer cart identity while preserving market and signed session", async () => {
  const f = await fixture("/account/logout?return_to=/fr-fr", {
    method: "POST",
    headers: { Origin: origin, Cookie: "cart=test" },
  });
  f.session.set("marketCountry", "ES");
  f.session.set("customerAccount", {
    tokens: {
      accessToken: "test-access",
      refreshToken: "test-refresh",
      expiresAt: Date.now() + 3600000,
    },
  });
  const response = await f.route();
  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get("Location")).pathname, "/fr-fr");
  assert.equal(f.session.get("customerAccount"), undefined);
  assert.equal(f.session.get("marketCountry"), "ES");
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.calls[0].buyerIdentity, { customerAccessToken: null });
});

test("cross-origin logout is rejected before changing customer or cart", async () => {
  const f = await fixture("/account/logout", {
    method: "POST",
    headers: { Origin: "https://other.example", Cookie: "cart=test" },
  });
  f.session.set("customerAccount", {
    tokens: { accessToken: "test-access", expiresAt: Date.now() + 3600000 },
  });
  const response = await f.route();
  assert.equal(response.status, 403);
  assert.ok(f.session.get("customerAccount"));
  assert.equal(f.calls.length, 0);
});

test("signed-out queued cart mutations explicitly clear a previous buyer token", async () => {
  const f = await fixture("/cart", { headers: { Cookie: "cart=test" } });
  const cart = createAspenCart({
    request: f.request,
    storefront: f.storefront,
    getCustomerAccessToken: async () => null,
  });
  const result = await cart.updateLines([
    { id: "gid://shopify/CartLine/test", quantity: 2 },
  ]);
  assert.deepEqual(result.userErrors, []);
  assert.equal(
    (f.calls[0].buyerIdentity as { customerAccessToken?: string | null })
      .customerAccessToken,
    null,
  );
});

test("failed logout detach expires the cart cookie without losing the session cookie", async () => {
  const f = await fixture("/account/logout", {
    method: "POST",
    headers: { Origin: origin, Cookie: "cart=test" },
  });
  Object.defineProperty(f.storefront, "graphql", {
    configurable: true,
    value: async () => {
      throw new Error("Shopify unavailable");
    },
  });
  const response = await f.route();
  assert.equal(response.status, 303);
  const cookies = response.headers.getSetCookie();
  assert.ok(
    cookies.some(
      (cookie) => cookie.startsWith("cart=;") && cookie.includes("Max-Age=0"),
    ),
  );
  assert.ok(cookies.some((cookie) => cookie.startsWith("session=")));
});

test("OAuth callback persists signed tokens and attaches the customer to the cart; refresh updates both", async (t) => {
  const config = { ...env, SHOP_ID: "222222" };
  let pending: { nonce: string; state: string; codeVerifier: string };
  const grants: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        String(input),
        "https://shopify.com/authentication/222222/oauth/token",
      );
      const body = new URLSearchParams(String(init?.body));
      const grant = body.get("grant_type");
      grants.push(grant);
      if (grant === "authorization_code")
        assert.equal(body.get("code_verifier"), pending.codeVerifier);
      const payload = {
        nonce: pending.nonce,
        iss: "https://shopify.com/authentication/222222",
        aud: config.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const idToken =
        "test." +
        Buffer.from(JSON.stringify(payload)).toString("base64url") +
        ".test";
      return Response.json({
        access_token:
          grant === "refresh_token" ? "refreshed-access" : "callback-access",
        refresh_token: "fixture-refresh",
        id_token: idToken,
        expires_in: 3600,
      });
    },
  );
  const login = await fixture(
    "/account/login?return_to=/fr-fr/account",
    undefined,
    config,
  );
  const loginResponse = await login.route();
  pending = (
    login.session.get("customerAccount") as { pendingLogin: typeof pending }
  ).pendingLogin;
  const cookie = loginResponse.headers
    .getSetCookie()
    .find((c) => c.startsWith("session="))
    .split(";")[0];
  const callback = await fixture(
    "/account/authorize?code=fixture-code&state=" + pending.state,
    { headers: { Cookie: cookie + "; cart=test" } },
    config,
  );
  const callbackResponse = await callback.route();
  assert.equal(
    new URL(callbackResponse.headers.get("Location")).pathname,
    "/fr-fr/account",
  );
  assert.deepEqual(callback.calls[0].buyerIdentity, {
    customerAccessToken: "callback-access",
  });
  const state = callback.session.get("customerAccount") as {
    tokens: { accessToken: string; expiresAt: number };
  };
  assert.equal(state.tokens.accessToken, "callback-access");
  assert.equal("pendingLogin" in state, false);
  state.tokens.expiresAt = Date.now() - 1;
  callback.session.set("customerAccount", state);
  const refreshedCookie = new Headers(await callback.session.commit())
    .getSetCookie()[0]
    .split(";")[0];
  const refresh = await fixture(
    "/account/refresh?return_to=/fr-fr/account",
    { headers: { Cookie: refreshedCookie + "; cart=test" } },
    config,
  );
  const refreshResponse = await refresh.route();
  assert.equal(
    new URL(refreshResponse.headers.get("Location")).pathname,
    "/fr-fr/account",
  );
  assert.deepEqual(refresh.calls[0].buyerIdentity, {
    customerAccessToken: "refreshed-access",
  });
  assert.deepEqual(grants, ["authorization_code", "refresh_token"]);
});

test("transient refresh preserves cart identity; definitive rejection clears it", async (t) => {
  let reject = false;
  const config = { ...env, SHOP_ID: "333333" };
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      reject
        ? { error: "invalid_grant" }
        : { error: "temporarily_unavailable" },
      { status: reject ? 400 : 503 },
    ),
  );
  for (const definitive of [false, true]) {
    reject = definitive;
    const f = await fixture(
      "/account/refresh?return_to=/fr-fr/account",
      { headers: { Cookie: "cart=test" } },
      config,
    );
    f.session.set("customerAccount", {
      tokens: {
        accessToken: "expired",
        refreshToken: "fixture-refresh",
        expiresAt: Date.now() - 1,
      },
    });
    const response = await f.route();
    assert.equal(response.status, 303);
    assert.equal(f.calls.length, definitive ? 1 : 0);
    if (definitive) {
      assert.equal(f.session.get("customerAccount"), undefined);
      assert.deepEqual(f.calls[0].buyerIdentity, { customerAccessToken: null });
    } else assert.ok(f.session.get("customerAccount"));
  }
});

test("OAuth callback rejects a mismatched state and cannot create a customer session", async () => {
  const f = await fixture(
    "/account/authorize?state=incorrect&code=fixture-code",
  );
  f.session.set("customerAccount", {
    pendingLogin: {
      state: "expected",
      nonce: "fixture-nonce",
      codeVerifier: "fixture-verifier",
      returnTo: "/account",
      origin,
      createdAt: Date.now(),
    },
  });
  const response = await f.route();
  assert.equal(response.status, 303);
  assert.match(response.headers.get("Location"), /\/account\?login=failed$/);
  const state = f.session.get("customerAccount") as { tokens?: unknown };
  assert.equal(state?.tokens, undefined);
});

test("account sign-in preserves order keys while removing single-fetch metadata", async () => {
  const { createCustomerAccount } = await import(
    "../app/.server/customer-account"
  );
  for (const [path, expected] of [
    [
      "/fr-fr/account/orders/123.data?key=fixture-order-key&_routes=root,order",
      "/fr-fr/account/orders/123?key=fixture-order-key",
    ],
    [
      "/fr-fr/account/_.data?tab=addresses&_data=route",
      "/fr-fr/account?tab=addresses",
    ],
    ["/fr-fr/_root.data?tab=account", "/fr-fr?tab=account"],
  ]) {
    const f = await fixture(path);
    const account = createCustomerAccount({
      env,
      request: f.request,
      session: f.session,
      storefront: f.storefront,
    });
    await assert.rejects(account.handleAuthStatus(), (error: unknown) => {
      assert.ok(error instanceof Response);
      const url = new URL(error.headers.get("Location"), origin);
      assert.equal(url.pathname, "/account/login");
      assert.equal(url.searchParams.get("return_to"), expected);
      assert.equal(error.headers.get("X-Remix-Reload-Document"), "true");
      return true;
    });
  }
});

test("HTTPS local account pages use real OAuth while HTTP and Studio retain preview fixtures", async () => {
  const { isAccountPreviewRequest } = await import(
    "../app/utils/account-preview.server"
  );
  assert.equal(
    isAccountPreviewRequest(new Request("http://localhost:3456/account")),
    true,
  );
  assert.equal(
    isAccountPreviewRequest(new Request("https://localhost:3456/account")),
    false,
  );
  assert.equal(
    isAccountPreviewRequest(new Request("https://store.example/account")),
    false,
  );
  assert.equal(
    isAccountPreviewRequest(
      new Request("https://localhost:3456/account?isDesignMode=true"),
    ),
    true,
  );
});

test("queued cart changes preserve customer binding and settle with errors during a transient token failure", async (t) => {
  const config = { ...env, SHOP_ID: "444444" };
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "temporarily_unavailable" }, { status: 503 }),
  );
  const { createCustomerAccount } = await import(
    "../app/.server/customer-account"
  );
  const f = await fixture(
    "/cart",
    { headers: { Cookie: "cart=test" } },
    config,
  );
  f.session.set("customerAccount", {
    tokens: {
      accessToken: "expired",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() - 1,
    },
  });
  const customer = createCustomerAccount({
    env: config,
    request: f.request,
    session: f.session,
    storefront: f.storefront,
  });
  const cart = createAspenCart({
    request: f.request,
    storefront: f.storefront,
    getCustomerAccessToken: customer.getCartAccessToken,
  });
  const result = await cart.updateLines([
    { id: "gid://shopify/CartLine/test", quantity: 2 },
  ]);
  assert.equal(
    f.calls.length,
    0,
    "An unknown customer token must not detach the buyer or mutate the cart",
  );
  assert.equal(await customer.isLoggedIn(), true);
  assert.ok(
    result.errors?.length,
    "The queue needs a settled error response so the shopper can retry",
  );
  const emptyCart = createAspenCart({
    request: new Request(origin + "/cart"),
    storefront: f.storefront,
    getCustomerAccessToken: customer.getCartAccessToken,
  });
  assert.ok((await emptyCart.create({ lines: [] })).errors?.length);
  assert.ok(
    (
      await emptyCart.addLines([
        { merchandiseId: "gid://shopify/ProductVariant/test", quantity: 1 },
      ])
    ).errors?.length,
  );
  assert.equal(
    f.calls.length,
    0,
    "A transient failure must not create a guest cart either",
  );
  f.session.set("customerAccount", {
    tokens: {
      accessToken: "recovered-access",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3600000,
    },
  });
  const retried = await cart.updateLines([
    { id: "gid://shopify/CartLine/test", quantity: 2 },
  ]);
  assert.deepEqual(retried.userErrors, []);
  assert.equal(f.calls.length, 2);
  assert.equal(
    (f.calls[0].buyerIdentity as { customerAccessToken: string })
      .customerAccessToken,
    "recovered-access",
  );
});
