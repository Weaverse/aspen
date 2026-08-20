/**
 * Shopify Storefront IDs are GIDs. Third-party APIs (Klaviyo, Judge.me)
 * usually want the trailing numeric id.
 */
export function shopifyNumericId(gid?: string | null) {
  if (!gid) {
    return "";
  }

  const lastSegment = gid.split("/").at(-1)?.trim() ?? "";
  return /^\d+$/.test(lastSegment) ? lastSegment : "";
}
