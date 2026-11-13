import {
  Cache,
  type CartUpdatePayload,
  createCartCookie,
  getCartId,
  gql,
} from "@shopify/hydrogen";
import type {
  CartBuyerIdentityInput,
  CartInput,
} from "@shopify/hydrogen/storefront-api-types";
import type { CartApiQueryFragment } from "~/graphql/storefront-types";
import { CART_FRAGMENT, cartHandlers } from "./cart";
import type { Storefront } from "./storefront";

export type CartMutationResult = {
  cart?: CartApiQueryFragment | null;
  userErrors?: Array<{ message: string; code?: string; field?: string[] }>;
  errors?: Array<{ message: string }>;
};
const BUYER = gql(
  `mutation AspenCartBuyer($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
  cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
    cart {
      ...CartFragment
    }
    userErrors {
      message
      code
      field
    }
  }
}`,
  [CART_FRAGMENT],
);
const GIFT_ADD = gql(
  `mutation AspenCartGiftAdd($cartId: ID!, $codes: [String!]!) {
  cartGiftCardCodesAdd(cartId: $cartId, giftCardCodes: $codes) {
    cart {
      ...CartFragment
    }
    userErrors {
      message
      code
      field
    }
  }
}`,
  [CART_FRAGMENT],
);
const GIFT_REMOVE = gql(
  `mutation AspenCartGiftRemove($cartId: ID!, $ids: [ID!]!) {
  cartGiftCardCodesRemove(cartId: $cartId, appliedGiftCardIds: $ids) {
    cart {
      ...CartFragment
    }
    userErrors {
      message
      code
      field
    }
  }
}`,
  [CART_FRAGMENT],
);
const CREATE = gql(
  `mutation AspenCartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      ...CartFragment
    }
    userErrors {
      message
      code
      field
    }
  }
}`,
  [CART_FRAGMENT],
);

/** Server gateway for Aspen's application-owned cart actions and permalinks. */
export function createAspenCart({
  request,
  storefront,
  getCustomerAccessToken,
}: {
  request: Request;
  storefront: Storefront;
  /** null is signed out; undefined is a transient account failure. */
  getCustomerAccessToken: () => Promise<string | null | undefined>;
}) {
  let id = getCartId(request);
  function setCartId(cartId: string) {
    id = cartId;
    return new Headers({ "Set-Cookie": createCartCookie(cartId) });
  }
  async function get() {
    const headers = new Headers(request.headers);
    const otherCookies = (headers.get("Cookie") || "")
      .split(";")
      .filter((cookie) => !cookie.trim().startsWith("cart="));
    if (id) otherCookies.push(`cart=${id.replace("gid://shopify/Cart/", "")}`);
    headers.set("Cookie", otherCookies.join(";"));
    const result = await cartHandlers.get({
      request: new Request(request.url, { headers }),
      storefrontClient: storefront,
    });
    if (result.data.errors?.length)
      throw new Error(result.data.errors[0].message);
    return result.data.cart as CartApiQueryFragment | null;
  }
  async function updateBuyerIdentity(
    buyerIdentity: CartBuyerIdentityInput,
  ): Promise<CartMutationResult> {
    if (!id) return { cart: null, userErrors: [] };
    const result = await storefront.graphql(BUYER, {
      variables: { cartId: id, buyerIdentity },
    });
    return { ...result.data?.cartBuyerIdentityUpdate, errors: result.errors };
  }
  async function getBuyerIdentity(): Promise<
    CartBuyerIdentityInput | undefined
  > {
    const token = await getCustomerAccessToken();
    if (token === undefined) return undefined;
    return {
      countryCode: storefront.i18n.country,
      customerAccessToken: token,
    };
  }
  function accountUnavailable(): CartMutationResult {
    return { errors: [{ message: "errors.generic" }] };
  }
  async function create(input: CartInput): Promise<CartMutationResult> {
    const buyerIdentity = await getBuyerIdentity();
    if (!buyerIdentity) return accountUnavailable();
    const result = await storefront.graphql(CREATE, {
      variables: {
        input: {
          ...input,
          buyerIdentity: {
            ...buyerIdentity,
            ...input.buyerIdentity,
          },
        },
      },
    });
    if (result.data?.cartCreate?.cart?.id) id = result.data.cartCreate.cart.id;
    return { ...result.data?.cartCreate, errors: result.errors };
  }
  async function mutate(
    body: Record<string, unknown>,
  ): Promise<CartMutationResult> {
    const buyerIdentity = await getBuyerIdentity();
    if (!buyerIdentity) return accountUnavailable();
    if (id) {
      const synced = await updateBuyerIdentity(buyerIdentity);
      const missingCart =
        synced.userErrors?.length &&
        synced.userErrors.every(
          (error) =>
            error.code === "INVALID" && error.field?.includes("cartId"),
        );
      if (body.intent === "add" && missingCart && !synced.errors?.length)
        id = undefined;
      else if (synced.userErrors?.length || synced.errors?.length)
        return synced;
    }
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/json");
    const otherCookies = (headers.get("Cookie") || "")
      .split(";")
      .filter((cookie) => !cookie.trim().startsWith("cart="));
    if (id) otherCookies.push(`cart=${id.replace("gid://shopify/Cart/", "")}`);
    headers.set("Cookie", otherCookies.join(";"));
    const result = await cartHandlers.post({
      storefrontClient: storefront,
      request: new Request(new URL("/api/cart", request.url), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    });
    if (result.type === "error")
      return { userErrors: [{ message: result.error.message }] };
    if (result.type !== "json") throw new Error("Unexpected cart redirect");
    const payload = result.data as CartMutationResult;
    if (payload.cart?.id) {
      id = payload.cart.id;
      if (body.intent === "add") await updateBuyerIdentity(buyerIdentity);
    }
    return payload;
  }
  return {
    get,
    getCartId: () => id,
    setCartId,
    create,
    updateBuyerIdentity,
    addLines: (lines: CartUpdatePayload["lines"]) =>
      mutate({ intent: "add", lines }),
    updateLines: (lines: CartUpdatePayload["lines"]) =>
      mutate({ intent: "update", lines }),
    removeLines: (lineIds: string[]) =>
      mutate({
        intent: "remove",
        // The JSON handler infers removal from zero-quantity lines.
        lines: lineIds.map((id) => ({ id, quantity: 0 })),
      }),
    updateDiscountCodes: (discountCodes: string[]) =>
      mutate({ intent: "discount-update", discountCodes }),
    updateNote: (note: string) => mutate({ intent: "note-update", note }),
    async addGiftCardCodes(codes: string[]): Promise<CartMutationResult> {
      if (!id) return { cart: null, userErrors: [] };
      const r = await storefront.graphql(GIFT_ADD, {
        variables: { cartId: id, codes },
      });
      return { ...r.data?.cartGiftCardCodesAdd, errors: r.errors };
    },
    async removeGiftCardCodes(ids: string[]): Promise<CartMutationResult> {
      if (!id) return { cart: null, userErrors: [] };
      const r = await storefront.graphql(GIFT_REMOVE, {
        variables: { cartId: id, ids },
      });
      return { ...r.data?.cartGiftCardCodesRemove, errors: r.errors };
    },
  };
}
