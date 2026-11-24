export const THEMIVO_STOREFRONT_ORIGIN = "https://wishlist-edge.themivo.com";

export type ThemivoCardPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const storefrontPath =
  /^\/(?:[a-z]{2}-[a-z]{2}(?:\/|$))?(?:(?:products|collections|pages|blogs|search|cart)(?:\/[^/]+){0,2}\/?)?$/i;

export const THEMIVO_PREVIEW_WISHLIST_PATH = "/wishlist/preview";

const previewWishlistPath = /^\/(?:[a-z]{2}-[a-z]{2}\/)?wishlist\/preview\/?$/i;

export function isPrivateWishlistPath(pathname: string) {
  return (
    previewWishlistPath.test(pathname) ||
    /^\/(?:[a-z]{2}-[a-z]{2}\/)?wishlist\/(?:shared|join)\//i.test(pathname)
  );
}

export function isThemivoScriptPreview(url: URL) {
  return (
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    (previewWishlistPath.test(url.pathname) ||
      (storefrontPath.test(url.pathname) &&
        url.searchParams.get("themivo-preview") === "1"))
  );
}

export function preserveThemivoPreview(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return href;
  }
  const url = new URL(href, "http://localhost");
  if (url.origin !== "http://localhost" || !storefrontPath.test(url.pathname)) {
    return href;
  }
  if (!url.searchParams.has("themivo-preview")) {
    url.searchParams.set("themivo-preview", "1");
  }
  return url.pathname + url.search + url.hash;
}
