import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { prefixPathWithLocale } from "~/utils/locale";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { cart } = context;

  try {
    const variantId = params.variantId;

    const inputLines = [
      {
        merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
        quantity: 1,
      },
    ];
    const result = await cart.addLines(inputLines);

    if (!result.cart) {
      return data(
        { errors: result.errors, userErrors: result.userErrors },
        { status: result.errors?.length ? 502 : 400 },
      );
    }
    const headers = cart.setCartId(result.cart.id);
    headers.set(
      "Location",
      prefixPathWithLocale("/cart", context.localization.selectedLocale),
    );

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
    console.error(e);
    return data({ error: e });
  }
}
