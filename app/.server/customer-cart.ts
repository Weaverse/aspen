import {
  getCartId,
  gql,
  type ShopifyRouteHandlerContext,
} from "@shopify/hydrogen";

const BUYER_IDENTITY =
  gql(`mutation AspenCustomerCartIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
  cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
    cart { id }
    userErrors { message }
  }
}`);

/** App-owned cart gateway also reconciles account changes made by native handlers. */
export async function syncCustomerCart(
  request: Request,
  storefront: ShopifyRouteHandlerContext["storefrontClient"],
  customerAccessToken: string | null,
): Promise<boolean> {
  const cartId = getCartId(request);
  if (!cartId) return true;
  try {
    const result = await storefront.graphql(BUYER_IDENTITY, {
      variables: { cartId, buyerIdentity: { customerAccessToken } },
    });
    return (
      !result.errors?.length &&
      !!result.data?.cartBuyerIdentityUpdate?.cart &&
      !result.data.cartBuyerIdentityUpdate.userErrors.length
    );
  } catch {
    return false;
  }
}

// Same cookie name/path as Hydrogen's cart cookie. Preserve other response cookies.
export const EXPIRED_CART_COOKIE = "cart=; Path=/; SameSite=Lax; Max-Age=0";
