import assert from "node:assert/strict";
import test from "node:test";
import { cartHandlers } from "../app/.server/cart";
import { AppSession } from "../app/.server/session";
import {
  createRequestStorefront,
  resolveRequestLocale,
} from "../app/.server/storefront";
import { getLegacyBrowseRedirect } from "../app/utils/collection-browse";
import { getPaginationVariables } from "../app/utils/pagination";
import { getSeoMeta } from "../app/utils/seo-meta";
import { InMemoryCache } from "./helpers/cache";

const secret = "migration-test-session-secret-at-least-32-characters";
test("anonymous sessions do not emit cookies; market choices survive the signed cookie", async () => {
  const request = new Request("https://store.example/fr-fr/products/chair");
  const session = await AppSession.init(request, [secret]);
  assert.equal(await session.commit(), undefined);
  session.set("marketCountry", "ES");
  const headers = new Headers(await session.commit());
  const cookie = headers.get("Set-Cookie");
  assert.ok(cookie?.includes("Secure"));
  const restored = await AppSession.init(
    new Request(request, { headers: { Cookie: cookie.split(";")[0] } }),
    [secret],
  );
  assert.equal(restored.get("marketCountry"), "ES");
  assert.equal(await restored.commit(), undefined);
});

test("unprefixed handlers inherit only same-origin market paths and login return_to", () => {
  assert.equal(
    resolveRequestLocale(
      new Request("https://store.example/api/cart", {
        headers: { Referer: "https://store.example/fr-fr/products/chair" },
      }),
    ).language,
    "FR",
  );
  assert.equal(
    resolveRequestLocale(
      new Request("https://store.example/api/cart", {
        headers: { Referer: "https://foreign.example/fr-fr/products/chair" },
      }),
    ).language,
    "EN",
  );
  assert.equal(
    resolveRequestLocale(
      new Request(
        "https://store.example/account/login?return_to=/es-es/account",
      ),
    ).language,
    "ES",
  );
});

test("Hydrogen owns the cart JSON response with private caching and no anonymous cookie", async () => {
  const request = new Request("https://store.example/api/cart");
  const storefront = createRequestStorefront({
    request,
    env: { PUBLIC_STORE_DOMAIN: "store.example" } as Env,
    cache: new InMemoryCache(),
    waitUntil: () => undefined,
  });
  const result = await cartHandlers.get({
    request,
    storefrontClient: storefront,
  });
  assert.equal(result.type, "json");
  assert.equal(result.data.cart, null);
  assert.match(new Headers(result.headers).get("Cache-Control"), /no-store/);
  assert.equal(new Headers(result.headers).get("Set-Cookie"), null);
});

test("legacy filters and sort redirect without losing merchant query params", () => {
  const redirect = getLegacyBrowseRedirect(
    new URL(
      'https://store.example/fr-fr/collections/chairs?filter.productVendor="Aspen"&sort=price-low-high&cursor=old&direction=next&utm_source=email',
    ),
  );
  assert.ok(redirect);
  const url = new URL(redirect, "https://store.example");
  assert.equal(url.pathname, "/fr-fr/collections/chairs");
  assert.equal(url.searchParams.get("filter.p.vendor"), "Aspen");
  assert.equal(url.searchParams.get("sort_by"), "price-ascending");
  assert.equal(url.searchParams.get("utm_source"), "email");
  assert.equal(url.searchParams.has("cursor"), false);
});

test("cursor pagination keeps forward and backward navigation", () => {
  assert.deepEqual(
    getPaginationVariables(
      new Request("https://store.example/products?before=abc"),
      { pageBy: 16 },
    ),
    { last: 16, startCursor: "abc" },
  );
  assert.deepEqual(
    getPaginationVariables(
      new Request("https://store.example/products?after=abc"),
      { pageBy: 16 },
    ),
    { first: 16, endCursor: "abc" },
  );
});

test("ported SEO keeps title, canonical, description and JSON-LD output", () => {
  const meta = getSeoMeta({
    title: "Chair",
    description: "Aspen chair",
    url: "https://store.example/fr-fr/products/chair",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Chair",
    },
  });
  assert.ok(meta.some((item) => "title" in item && item.title === "Chair"));
  assert.ok(
    meta.some(
      (item) =>
        "name" in item &&
        item.name === "description" &&
        item.content === "Aspen chair",
    ),
  );
  assert.ok(
    meta.some(
      (item) =>
        "rel" in item &&
        item.rel === "canonical" &&
        item.href === "https://store.example/fr-fr/products/chair",
    ),
  );
  assert.ok(meta.some((item) => "script:ld+json" in item));
});

test("Shopify redirects preserve market prefixes during single-fetch navigation", async () => {
  const { marketAwareRedirect } = await import(
    "../app/.server/market-redirect"
  );
  let lookedUp = "";
  const result = await marketAwareRedirect(
    new Request("https://store.example/fr-fr/old.data"),
    async (request) => {
      lookedUp = new URL(request.url).pathname;
      return new Response(null, {
        status: 301,
        headers: { Location: "/products/chair?ref=old" },
      });
    },
  );
  assert.equal(lookedUp, "/old");
  assert.equal(result.status, 204);
  assert.equal(
    result.headers.get("X-Remix-Redirect"),
    "/fr-fr/products/chair?ref=old",
  );
  assert.equal(result.headers.get("Location"), null);
});

test("queued cart removal reaches Hydrogen's JSON handler as zero-quantity lines", async () => {
  const { createAspenCart } = await import("../app/.server/cart-gateway");
  const request = new Request("https://store.example/cart", {
    headers: { Cookie: "cart=test-cart?key=test-key" },
  });
  const storefront = createRequestStorefront({
    request,
    env: { PUBLIC_STORE_DOMAIN: "store.example" } as Env,
    cache: new InMemoryCache(),
    waitUntil: () => undefined,
  });
  const operations: Array<Record<string, unknown>> = [];
  const removedCart = { id: "gid://shopify/Cart/test-cart", totalQuantity: 0 };
  Object.defineProperty(storefront, "graphql", {
    value: async (
      _document: unknown,
      options: { variables: Record<string, unknown> },
    ) => {
      operations.push(options.variables);
      return {
        data:
          operations.length === 1
            ? { cartBuyerIdentityUpdate: { cart: null, userErrors: [] } }
            : {
                cartLinesRemove: {
                  cart: removedCart,
                  userErrors: [],
                  warnings: [],
                },
              },
        headers: new Headers(),
      };
    },
  });
  const gateway = createAspenCart({
    request,
    storefront,
    getCustomerAccessToken: async () => null,
  });
  const result = await gateway.removeLines(["gid://shopify/CartLine/line-1"]);
  assert.deepEqual(result.userErrors, []);
  assert.deepEqual(result.cart, removedCart);
  assert.equal(operations.length, 2);
  assert.deepEqual(operations[1].lineIds, ["gid://shopify/CartLine/line-1"]);
});
