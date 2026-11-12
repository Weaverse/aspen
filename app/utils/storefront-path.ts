import { getLocaleSegment, stripLocalePrefix } from "~/utils/locale";

export function shopifyPagePath(handle: string) {
  return handle === "contact" ? "/contact" : `/pages/${handle}`;
}

/** Map Shopify aliases to Aspen's primary URLs without changing other paths. */
export function canonicalStorefrontPathname(pathname: string) {
  // React Router keeps the single-fetch `.data` suffix on loader requests.
  const path = stripLocalePrefix(pathname)
    .replace(/\.data$/, "")
    .replace(/\/$/, "");
  let canonical: string;
  if (path === "/pages/contact") {
    canonical = shopifyPagePath("contact");
  } else if (path === "/collections/all") {
    canonical = "/products";
  } else {
    return pathname;
  }

  const locale = getLocaleSegment(pathname);
  return `${locale ? `/${locale}` : ""}${canonical}`;
}
