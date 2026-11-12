import { type LoaderFunctionArgs, redirect } from "react-router";
import { prefixPathWithLocale } from "~/utils/locale";
import { canonicalStorefrontPathname } from "~/utils/storefront-path";

/**
 * Automatically applies a discount found on the url
 * If a cart exists it's updated with the discount, otherwise a cart is created with the discount already applied
 * @param ?redirect an optional path to return to otherwise return to the home page
 * @example
 * Example path applying a discount and redirecting
 * ```ts
 * /discount/FREESHIPPING?redirect=/products
 *
 * ```
 * @preserve
 */
export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { cart, session } = context;
  // N.B. This route will probably be removed in the future.
  const { code } = params;

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const fallback = prefixPathWithLocale(
    "/",
    context.localization.selectedLocale,
  );
  const redirectParam =
    searchParams.get("redirect") || searchParams.get("return_to") || fallback;
  let destination = new URL(fallback, url.origin);
  // Only accept local paths, including when URL parsing normalizes backslashes
  // or control characters into a different origin.
  if (redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    try {
      const candidate = new URL(redirectParam, url.origin);
      if (
        candidate.origin === url.origin &&
        !candidate.pathname.startsWith("//")
      ) {
        destination = candidate;
      }
    } catch {
      // Keep the localized home page for an invalid destination.
    }
  }

  searchParams.delete("redirect");
  searchParams.delete("return_to");

  destination.pathname = prefixPathWithLocale(
    canonicalStorefrontPathname(destination.pathname),
    context.localization.selectedLocale,
  );
  for (const [key, value] of searchParams) {
    destination.searchParams.append(key, value);
  }
  const redirectUrl =
    destination.pathname + destination.search + destination.hash;

  if (!code) {
    return redirect(redirectUrl);
  }

  const result = await cart.updateDiscountCodes([code]);

  /**
   * Manual workaround for React Router v7 compatibility issue with cart.setCartId()
   */
  session.set("cartId", result.cart.id);
  const headers = new Headers();
  headers.set("Set-Cookie", await session.commit());

  // Using set-cookie on a 303 redirect will not work if the domain origin have port number (:3000)
  // If there is no cart id and a new cart id is created in the progress, it will not be set in the cookie
  // on localhost:3000
  return redirect(redirectUrl, {
    status: 303,
    headers,
  });
}
