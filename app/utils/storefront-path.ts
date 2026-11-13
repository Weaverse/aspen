import { FILTER_URL_PREFIX } from "~/utils/filter";
import { getLocaleSegment, stripLocalePrefix } from "~/utils/locale";

export function shopifyPagePath(handle: string) {
  return handle === "contact" ? "/contact" : `/pages/${handle}`;
}

function resourcePathname(pathname: string) {
  // React Router keeps the single-fetch `.data` suffix on loader requests.
  return stripLocalePrefix(pathname)
    .replace(/\.data$/, "")
    .replace(/\/$/, "");
}

/** /products does not implement collection filter/sort query semantics. */
export function isFilteredAllProductsPath(
  pathname: string,
  search: string | URLSearchParams = "",
) {
  if (resourcePathname(pathname) !== "/collections/all") {
    return false;
  }
  const params = new URLSearchParams(search);
  return (
    params.has("sort") ||
    params.has("sort_by") ||
    [...params.keys()].some((key) => key.startsWith(FILTER_URL_PREFIX))
  );
}

/** Map aliases only when the primary route can preserve their behavior. */
export function canonicalStorefrontPathname(
  pathname: string,
  search: string | URLSearchParams = "",
) {
  const path = resourcePathname(pathname);
  let canonical: string;
  if (path === "/pages/contact") {
    canonical = shopifyPagePath("contact");
  } else if (
    path === "/collections/all" &&
    !isFilteredAllProductsPath(pathname, search)
  ) {
    canonical = "/products";
  } else {
    return pathname;
  }

  const locale = getLocaleSegment(pathname);
  return `${locale ? `/${locale}` : ""}${canonical}`;
}
