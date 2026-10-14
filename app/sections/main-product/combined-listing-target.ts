import type { MappedProductOptions } from "@shopify/hydrogen";
import { isCombinedListing } from "~/utils/combined-listings";

/** A tag alone does not prove that this page represents child products. */
export function getCombinedListingTarget(
  product: { handle: string; tags: string[] },
  options: MappedProductOptions[],
) {
  if (!isCombinedListing(product)) {
    return null;
  }
  const children = options.flatMap(({ optionValues }) =>
    optionValues.filter(
      (value) =>
        value.isDifferentProduct &&
        value.handle &&
        value.handle !== product.handle,
    ),
  );
  const child =
    children.find((value) => value.selected) ??
    children.find((value) => value.available) ??
    children[0];
  if (!child) {
    return null;
  }
  // Hydrogen resolves handle and query together for the current option combination.
  return `/products/${child.handle}${child.variantUriQuery ? `?${child.variantUriQuery}` : ""}`;
}
