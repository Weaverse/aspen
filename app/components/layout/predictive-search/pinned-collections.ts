import type { NormalizedPredictiveSearchResultItem } from "~/types/predictive-search";

export function withPinnedCollections(
  items: NormalizedPredictiveSearchResultItem[] | undefined,
  pinned: {
    allTitle: string;
    allUrl: string;
  },
) {
  const pinnedItems: NormalizedPredictiveSearchResultItem[] = [
    {
      handle: "all",
      id: "pinned-collection-all",
      title: pinned.allTitle,
      url: pinned.allUrl,
    },
  ];
  const matching = (items ?? []).filter((item) => {
    const handle = item.handle.toLowerCase();
    const title = item.title.trim().toLowerCase();
    return handle !== "all" && title !== "all";
  });
  return [...pinnedItems, ...matching];
}
