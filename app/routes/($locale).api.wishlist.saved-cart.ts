import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "react-router";
import { readThemivoAppearance } from "~/utils/themivo-appearance.server";
import { hydrateThemivoItems } from "~/utils/themivo-products.server";
import {
  checkThemivoPost,
  readThemivoSavedCart,
  ThemivoError,
  themivoEnabled,
  themivoErrorKey,
  transferThemivoCartItem,
} from "~/utils/themivo-wishlist.server";

const NO_STORE = { "Cache-Control": "private, no-store" };

async function requireSavedCart({ context, request }: LoaderFunctionArgs) {
  const appearance = themivoEnabled(context)
    ? await readThemivoAppearance(
        context.env.PUBLIC_STORE_DOMAIN,
        new URL(request.url).origin,
        context.storefront.i18n,
      )
    : null;
  if (!appearance?.saveForLater) {
    throw new ThemivoError("feature_disabled", 404);
  }
  return appearance;
}

export async function loader(args: LoaderFunctionArgs) {
  const { context } = args;
  try {
    await requireSavedCart(args);
    const { items, hiddenPrices } = await readThemivoSavedCart(context);
    return data(
      {
        items: await hydrateThemivoItems(
          context.storefront,
          items,
          hiddenPrices,
        ),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return data(
      { items: [], wishlistError: themivoErrorKey(error) },
      { headers: NO_STORE },
    );
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;
  try {
    checkThemivoPost(request);
    const appearance = await requireSavedCart(args);
    const form = await request.formData();
    const intent = form.get("intent");
    if (intent !== "save" && intent !== "restore" && intent !== "discard") {
      throw new ThemivoError("bad_request", 400);
    }
    if (
      !appearance.guestWishlist &&
      !(await context.customerAccount.isLoggedIn())
    ) {
      throw new ThemivoError("login_required", 401);
    }
    const result = await transferThemivoCartItem(
      context,
      intent,
      form,
      appearance.translations["sfl.list_name"],
    );
    const headers = result.cart
      ? context.cart.setCartId(result.cart.id)
      : new Headers();
    headers.set("Cache-Control", NO_STORE["Cache-Control"]);
    return data({ ...result, savedCartChanged: true }, { headers });
  } catch (error) {
    return data(
      {
        wishlistError: themivoErrorKey(error),
        savedCartChanged:
          error instanceof ThemivoError &&
          error.code === "cart_transfer_incomplete",
      },
      {
        status: error instanceof ThemivoError ? error.status : 503,
        headers: NO_STORE,
      },
    );
  }
}
