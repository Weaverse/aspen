import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type {
  NormalizedPredictiveSearch,
  NormalizedPredictiveSearchResults,
  PredictiveSearchResponse,
} from "~/types/predictive-search";
import { PREDICTIVE_SEARCH_FETCHER_KEY } from "~/types/predictive-search";

export const NO_PREDICTIVE_SEARCH_RESULTS: NormalizedPredictiveSearchResults = [
  { type: "queries", items: [] },
  { type: "products", items: [] },
  { type: "collections", items: [] },
  { type: "pages", items: [] },
  { type: "articles", items: [] },
];

export function usePredictiveSearch(): NormalizedPredictiveSearch & {
  searchTerm: React.RefObject<string>;
  searchTermValue: string;
  searchState: "idle" | "loading" | "submitting";
} {
  const searchTerm = useRef<string>("");
  const searchFetcher = useFetcher<PredictiveSearchResponse>({
    key: PREDICTIVE_SEARCH_FETCHER_KEY,
  });
  const submittedTerm = searchFetcher?.formData?.get("q");
  const responseTerm = searchFetcher?.data?.searchTerm;
  const searchTermValue =
    typeof submittedTerm === "string"
      ? submittedTerm
      : typeof responseTerm === "string"
        ? responseTerm
        : searchTerm.current;

  useEffect(() => {
    if (typeof submittedTerm === "string") {
      searchTerm.current = submittedTerm;
    } else if (typeof responseTerm === "string") {
      searchTerm.current = responseTerm;
    }
  }, [submittedTerm, responseTerm]);

  const search = (searchFetcher?.data?.searchResults || {
    results: NO_PREDICTIVE_SEARCH_RESULTS,
    totalResults: 0,
  }) as NormalizedPredictiveSearch;

  return {
    ...search,
    searchTerm,
    searchTermValue,
    searchState: searchFetcher.state,
  };
}
