import type {
  PredictiveArticleFragment,
  PredictiveCollectionFragment,
  PredictiveProductFragment,
} from "storefront-api.generated";

export const PREDICTIVE_SEARCH_FETCHER_KEY = "predictive-search";

type PredictiveSearchResultItemImage =
  | PredictiveCollectionFragment["image"]
  | PredictiveArticleFragment["image"]
  | PredictiveProductFragment["featuredImage"];

type PredictiveSearchResultItemPrice = NonNullable<
  PredictiveProductFragment["selectedOrFirstAvailableVariant"]
>["price"];

export type PredictiveSearchSwatch = {
  name: string;
  color?: string | null;
  image?: {
    url: string;
    altText?: string | null;
  } | null;
  selected?: boolean;
};

export type NormalizedPredictiveSearch = {
  results: NormalizedPredictiveSearchResults;
  totalResults: number;
};

export type PredictiveSearchResponse = {
  searchResults?: NormalizedPredictiveSearch;
  searchTerm?: string;
  error?: string;
};

export type NormalizedPredictiveSearchResults = Array<
  | { type: "queries"; items: NormalizedPredictiveSearchResultItem[] }
  | { type: "products"; items: NormalizedPredictiveSearchResultItem[] }
  | { type: "collections"; items: NormalizedPredictiveSearchResultItem[] }
  | { type: "pages"; items: NormalizedPredictiveSearchResultItem[] }
  | { type: "articles"; items: NormalizedPredictiveSearchResultItem[] }
>;

export type NormalizedPredictiveSearchResultItem = {
  __typename?:
    | "SearchQuerySuggestion"
    | "Product"
    | "Collection"
    | "Page"
    | "Article";
  handle: string;
  id: string;
  image?: PredictiveSearchResultItemImage;
  price?: PredictiveSearchResultItemPrice;
  compareAtPrice?: PredictiveSearchResultItemPrice;
  ratingValue?: string;
  ratingCountValue?: string;
  swatches?: PredictiveSearchSwatch[];
  styledTitle?: string;
  title: string;
  vendor?: string;
  url: string;
};
