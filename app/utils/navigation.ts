/** Identify menu behavior by destination, never by a translated display label. */
export function getNavigationKind(item: {
  to: string;
  title: string;
  type?: string;
}) {
  const url = new URL(item.to, "https://storefront.invalid");
  const path =
    url.pathname
      .replace(/^\/[a-z]{2}-[a-z]{2}(?=\/|$)/i, "")
      .replace(/\/$/, "") || "/";
  if (
    item.type === "FRONTPAGE" ||
    (path === "/" && url.hostname === "storefront.invalid")
  ) {
    return "home";
  }
  if (url.hostname === "weaverse.io" || url.hostname.endsWith(".weaverse.io")) {
    return "weaverse";
  }
  if (path === "/collections") {
    return "collections";
  }
  if (path === "/blogs") {
    return "blogs";
  }
  if (path === "/contact" || path === "/pages/contact") {
    return "about";
  }
  return item.title.trim().toLowerCase();
}
