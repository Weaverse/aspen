import { defaultTranslation, type Translate } from "./translation.ts";

const legacyErrorKeys: Record<string, string> = {
  "Something went wrong! Please try again.": "errors.generic",
  "Please enter a valid email address.": "errors.invalidEmail",
  "Email is required": "errors.emailRequired",
  "Message is required": "errors.messageRequired",
  "Message must be 5000 characters or fewer": "errors.messageTooLong",
  "Name must be 200 characters or fewer": "errors.nameTooLong",
  "Method not allowed": "errors.methodNotAllowed",
  "Method not allowed.": "errors.methodNotAllowed",
  "Invalid wishlist request.": "errors.wishlistInvalidRequest",
  "Wishlist could not be updated. Please try again.": "errors.wishlistUpdate",
  "A product variant is required": "errors.variantRequired",
  "This product isn't available for restock alerts yet. Please try again later.":
    "errors.restockUnavailable",
  "You must provide an address id.": "errors.addressRequired",
  "Address not found.": "errors.addressNotFound",
  Unauthorized: "errors.unauthorized",
  "Customer address create failed.": "errors.addressCreate",
  "Customer address update failed.": "errors.addressUpdate",
  "Customer address delete failed.": "errors.addressDelete",
  "Customer profile update failed.": "errors.profileUpdate",
  "Failed to create review!": "errors.reviewCreate",
  "Wishlist is temporarily unavailable.": "errors.wishlistUnavailable",
  "Wishlist changed in another session. Please try again.":
    "errors.wishlistConflict",
  "Search is temporarily unavailable. Please try again.":
    "errors.searchUnavailable",
  "An unexpected error occurred": "errors.unexpected",
  "Enter a valid email address": "errors.invalidEmail",
  "Search is temporarily unavailable": "errors.searchUnavailable",
};

export function translateError(t: Translate, error: unknown): string {
  const value = typeof error === "string" ? error : "";
  if (/^Wishlist supports up to \d+ products\.$/.test(value)) {
    return t("errors.wishlistLimit");
  }
  const key =
    (Object.hasOwn(legacyErrorKeys, value)
      ? legacyErrorKeys[value]
      : undefined) ??
    (value.startsWith("errors.") && defaultTranslation(value)
      ? value
      : "errors.generic");
  return t(key);
}
