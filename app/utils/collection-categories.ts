/** Curated navigation groups. Match existing Shopify type/tag/title metadata;
 * do not infer materials or product types from images. Groups can overlap. */
export const COLLECTION_CATEGORIES = {
  beds: [
    {
      key: "bed-frames",
      label: "Bed Frames",
      pattern: /\bbed(?:s|\s*frames?)?\b/i,
    },
    {
      key: "storage-beds",
      label: "Storage Beds",
      pattern: /\bstorage\b|\bdrawers?\b|\botto?man\s+bed\b/i,
    },
    {
      key: "upholstered-beds",
      label: "Upholstered Beds",
      pattern: /\bupholster\w*\b|\bfabric\b|\bvelvet\b|\bboucl[eé]\b/i,
    },
  ],
  chairs: [
    {
      key: "lounge-chairs",
      label: "Lounge Chairs",
      pattern: /\blounge\b|\barmchairs?\b|\baccent\b|\brecliner\w*\b/i,
    },
    { key: "dining-chairs", label: "Dining Chairs", pattern: /\bdining\b/i },
    {
      key: "office-chairs",
      label: "Office Chairs",
      pattern: /\boffice\b|\bdesk\b|\btask\b/i,
    },
  ],
  sofas: [
    {
      key: "sectional-sofas",
      label: "Sectional Sofas",
      pattern: /\bsectionals?\b/i,
    },
    {
      key: "sofa-beds",
      label: "Sofa Beds",
      pattern: /\bsofa\s*beds?\b|\bsleeper\b|\bconvertible\b/i,
    },
    {
      key: "modular-sofas",
      label: "Modular Sofas",
      pattern: /\bmodular\b|\bbuild[ -]your[ -]own\b/i,
    },
  ],
} as const;

type Category =
  (typeof COLLECTION_CATEGORIES)[keyof typeof COLLECTION_CATEGORIES][number];

export function getCollectionCategories(handle: string): readonly Category[] {
  return Object.hasOwn(COLLECTION_CATEGORIES, handle)
    ? COLLECTION_CATEGORIES[handle as keyof typeof COLLECTION_CATEGORIES]
    : [];
}

export function getCollectionCategory(handle: string, key: string | null) {
  return getCollectionCategories(handle).find(
    (category) => category.key === key,
  );
}

export function matchesCollectionCategory(
  product: { title: string; productType?: string; tags?: readonly string[] },
  category: Category,
) {
  return [
    product.title,
    product.productType ?? "",
    ...(product.tags ?? []),
  ].some((text) =>
    category.pattern.test(
      text.normalize("NFD").replace(/\p{M}/gu, "").replace(/[-_]/g, " "),
    ),
  );
}
