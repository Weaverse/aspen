import assert from "node:assert/strict";
import test from "node:test";
import { getCartId } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { createAspenCart } from "../app/.server/cart-gateway";
import { AppSession } from "../app/.server/session";
import { loader as permalink } from "../app/routes/($locale).cart.$lines";
import { loader as add } from "../app/routes/($locale).cart.add.$variantId";
import { loader as discount } from "../app/routes/($locale).discount.$code";

const cartId = "gid://shopify/Cart/new-token?key=secret";
const secret = "cart-link-regression-session-secret";
async function fixture(path: string, cookie = "", fail = false) {
  const request = new Request(`https://store.example${path}`, {
    headers: { Cookie: cookie },
  });
  const session = await AppSession.init(request, [secret]);
  const calls: Record<string, any>[] = [];
  const cartData = {
    id: cartId,
    checkoutUrl: "https://checkout.example/cart",
    lines: { nodes: [] },
  };
  const payload = fail
    ? {
        cart: null,
        userErrors: [{ message: "Rejected", code: "INVALID" }],
        warnings: [],
      }
    : { cart: cartData, userErrors: [], warnings: [] };
  const storefront = {
    i18n: { country: "US", language: "EN" },
    graphql: async (
      _query: unknown,
      options: { variables: Record<string, any> },
    ) => {
      calls.push(options.variables);
      return {
        data: {
          cart: cartData,
          cartCreate: payload,
          cartLinesAdd: payload,
          cartBuyerIdentityUpdate: payload,
          cartDiscountCodesUpdate: payload,
        },
        headers: new Headers(),
      };
    },
  } as unknown as Parameters<typeof createAspenCart>[0]["storefront"];
  const cart = createAspenCart({
    request,
    storefront,
    getCustomerAccessToken: async () => null,
  });
  const args = {
    request,
    context: {
      cart,
      session,
      localization: {
        selectedLocale: { language: "EN", country: "US", pathPrefix: "" },
      },
    },
    params: { variantId: "123", lines: "123:2", code: "TEST" },
  } as unknown as LoaderFunctionArgs;
  return { args, cart, session, calls, storefront };
}

for (const [name, loader, path] of [
  ["add link", add, "/cart/add/123"],
  ["cart permalink", permalink, "/cart/123:2?discount=TEST"],
  ["discount without a cart", discount, "/discount/TEST?redirect=/products"],
] as const) {
  test(`${name} persists the new cart across a redirect and preserves session cookies`, async () => {
    const f = await fixture(path);
    f.session.set("marketCountry", "FR");
    const result = await loader(f.args);
    const headers =
      result instanceof Response
        ? result.headers
        : new Headers(result.init?.headers);
    assert.ok(
      headers.getSetCookie().some((cookie) => cookie.startsWith("cart=")),
    );
    // server.ts appends pending session cookies after the loader returns.
    for (const [key, value] of new Headers(await f.session.commit())) {
      headers.append(key, value);
    }
    assert.equal(headers.getSetCookie().length, 2);
    const cookies = headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const next = new Request("https://store.example/cart", {
      headers: { Cookie: cookies },
    });
    assert.equal(getCartId(next), cartId);
    const restoredSession = await AppSession.init(next, [secret]);
    assert.equal(restoredSession.get("marketCountry"), "FR");
    assert.equal(restoredSession.get("cartId"), undefined);
    const nextCart = createAspenCart({
      request: next,
      storefront: f.storefront,
      getCustomerAccessToken: async () => null,
    });
    assert.equal((await nextCart.get())?.id, cartId);
    assert.equal(f.calls.at(-1)?.id, cartId);
    if (name === "discount without a cart") {
      assert.deepEqual(f.calls[0].input.discountCodes, ["TEST"]);
      assert.equal(headers.get("Location"), "/products");
    }
    if (name === "cart permalink") {
      assert.deepEqual(f.calls[0].input.lines, [
        { merchandiseId: "gid://shopify/ProductVariant/123", quantity: 2 },
      ]);
      assert.deepEqual(f.calls[0].input.discountCodes, ["TEST"]);
    }
  });
}

test("discount on an existing cart updates it instead of creating another cart", async () => {
  const f = await fixture("/discount/TEST", "cart=old-token");
  const result = await discount(f.args);
  assert.equal(result.status, 303);
  assert.ok(f.calls.some((call) => call.discountCodes?.[0] === "TEST"));
  assert.ok(f.calls.every((call) => !call.input));
  assert.equal(
    getCartId(
      new Request("https://store.example/cart", {
        headers: { Cookie: result.headers.getSetCookie()[0] },
      }),
    ),
    cartId,
  );
});

test("failed discount creation/update produces a controlled response instead of reading a missing cart", async () => {
  for (const cookie of ["", "cart=old-token"]) {
    const f = await fixture("/discount/TEST", cookie, true);
    await assert.rejects(
      () => discount(f.args),
      (error) => error instanceof Response && error.status === 400,
    );
  }
});

test("failed add returns the API errors without a cart redirect or cookie", async () => {
  const f = await fixture("/cart/add/123", "", true);
  const result = await add(f.args);
  assert.equal(result.init?.status, 400);
  assert.equal(new Headers(result.init?.headers).has("Set-Cookie"), false);
  assert.equal(new Headers(result.init?.headers).has("Location"), false);
  assert.ok("userErrors" in result.data && result.data.userErrors?.length);
});
