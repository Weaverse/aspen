import { type LoaderFunctionArgs, redirect } from "react-router";
import { prefixPathWithLocale } from "~/utils/locale";
import { canonicalStorefrontPathname } from "~/utils/storefront-path";
import { defaultTranslation } from "~/utils/translation";

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
  const { cart } = context;
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

  for (const [key, value] of searchParams) {
    destination.searchParams.append(key, value);
  }
  destination.pathname = prefixPathWithLocale(
    canonicalStorefrontPathname(destination.pathname, destination.searchParams),
    context.localization.selectedLocale,
  );
  const redirectUrl =
    destination.pathname + destination.search + destination.hash;

  if (!code) {
    return redirect(redirectUrl);
  }

  const result = cart.getCartId()
    ? await cart.updateDiscountCodes([code])
    : await cart.create({ discountCodes: [code] });
  if (!result.cart || result.errors?.length || result.userErrors?.length) {
    throw new Response(defaultTranslation("errors.generic"), {
      status: result.errors?.length ? 502 : 400,
    });
  }
  const headers = cart.setCartId(result.cart.id);
  return redirect(redirectUrl, {
    status: 303,
    headers,
  });
}
