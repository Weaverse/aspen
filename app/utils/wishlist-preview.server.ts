import { createCookie } from "react-router";
import { isAccountPreviewRequest } from "~/utils/account-preview.server";
import { parseWishlist } from "~/utils/wishlist.server";

const previewWishlistCookie = createCookie("__aspen_wishlist_preview", {
  httpOnly: true,
  maxAge: 60 * 60 * 24,
  path: "/",
  sameSite: "lax",
});

export function isWishlistPreviewRequest(request: Request) {
  return isAccountPreviewRequest(request);
}

export async function readPreviewWishlist(request: Request) {
  const stored = await previewWishlistCookie.parse(
    request.headers.get("Cookie"),
  );

  if (Array.isArray(stored)) {
    return parseWishlist(JSON.stringify(stored));
  }

  return typeof stored === "string" ? parseWishlist(stored) : [];
}

export function commitPreviewWishlist(productIds: string[]) {
  return previewWishlistCookie.serialize(productIds);
}
