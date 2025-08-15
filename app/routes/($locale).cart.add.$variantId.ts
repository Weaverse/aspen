import type { LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { data, redirect } from "@shopify/remix-oxygen";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { cart, session } = context;

  try {
    const variantId = params.variantId;

    const inputLines = [
      {
        merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
        quantity: 1,
      },
    ];
    const result = await cart.addLines(inputLines);

    /**
     * The Cart ID may change after each mutation. We need to update it each time in the session.
     * Manual workaround for React Router v7 compatibility issue with cart.setCartId()
     */
    const cartId = result.cart.id;
    session.set("cartId", cartId);
    const headers = new Headers();
    headers.set("Set-Cookie", await session.commit());
    headers.set("Location", "/cart");

    const { cart: cartResult, errors, userErrors } = result;

    return data(
      {
        cart: cartResult,
        userErrors,
        errors,
      },
      { status: 303, headers },
    );
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: <explanation> --- IGNORE ---
    console.error(e);
    return data({ error: e });
  }
}
