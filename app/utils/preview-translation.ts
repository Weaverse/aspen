import type { Translate } from "./translation.ts";

const previewKeys: Record<string, string> = {
  "Living Room": "preview.livingRoom",
  Bedroom: "preview.bedroom",
  "Dining Room": "preview.diningRoom",
  Outdoor: "preview.outdoor",
  Workspace: "preview.workspace",
  Lighting: "preview.lighting",
  "Product Title": "product.exampleTitle",
  "Example Product Title": "product.exampleTitle",
  "Example Product": "product.exampleTitle",
  Vendor: "preview.vendor",
  "Product placeholder": "accessibility.imagePlaceholder",
};

// Called only on theme-owned sample objects, never on real Shopify records.
export function translatePreview<T>(t: Translate, value: T): T {
  if (typeof value === "string") {
    if (Object.hasOwn(previewKeys, value)) {
      return t(previewKeys[value]) as T;
    }
    const match = value.match(/^(.*) collection( thumbnail)?$/);
    if (match && Object.hasOwn(previewKeys, match[1])) {
      return t(
        match[2]
          ? "preview.collectionThumbnail"
          : "preview.collectionDescription",
        { title: t(previewKeys[match[1]]) },
      ) as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((child) => translatePreview(t, child)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        translatePreview(t, child),
      ]),
    ) as T;
  }
  return value;
}
