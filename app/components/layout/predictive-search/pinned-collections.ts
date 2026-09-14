import type { NormalizedPredictiveSearchResultItem } from "~/types/predictive-search";

export function withPinnedCollections(
  items: NormalizedPredictiveSearchResultItem[] | undefined,
  pinned: {
    allTitle: string;
    allUrl: string;
    newArrivalsTitle: string;
    newArrivalsUrl: string;
  },
) {
  const pinnedItems: NormalizedPredictiveSearchResultItem[] = [
    {
      handle: "all",
      id: "pinned-collection-all",
      title: pinned.allTitle,
      url: pinned.allUrl,
    },
    {
      handle: "new-arrivals",
      id: "pinned-collection-new-arrivals",
      title: pinned.newArrivalsTitle,
      url: pinned.newArrivalsUrl,
    },
  ];
  const matching = (items ?? []).filter((item) => {
    const handle = item.handle.toLowerCase();
    const title = item.title.trim().toLowerCase();
    return (
      handle !== "all" &&
      !handle.includes("new-arrival") &&
      title !== "all" &&
      title !== "new arrivals" &&
      title !== "new arrival"
    );
  });
  return [...pinnedItems, ...matching];
}
