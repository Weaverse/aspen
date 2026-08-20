import { mapSelectedProductOptionToObject } from "@shopify/hydrogen";
import { data, type LoaderFunctionArgs } from "react-router";
import type {
  PredictiveArticleFragment,
  PredictiveCollectionFragment,
  PredictivePageFragment,
  PredictiveProductFragment,
  PredictiveQueryFragment,
  PredictiveSearchQuery,
} from "storefront-api.generated";
import { NO_PREDICTIVE_SEARCH_RESULTS } from "~/hooks/use-predictive-search";
import type {
  NormalizedPredictiveSearch,
  NormalizedPredictiveSearchResults,
} from "~/types/predictive-search";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

type PredictiveSearchResultItem =
  | PredictiveArticleFragment
  | PredictiveCollectionFragment
  | PredictivePageFragment
  | PredictiveProductFragment;

type PredictiveProductWithOptions = PredictiveProductFragment & {
  options?: Array<{
    name: string;
    optionValues: Array<{
      name: string;
      swatch?: {
        color?: string | null;
        image?: {
          previewImage?: {
            url: string;
            altText?: string | null;
          } | null;
        } | null;
      } | null;
    }>;
  }>;
};

type PredictiveSearchTypes = "COLLECTION" | "PAGE" | "PRODUCT" | "QUERY";

const DEFAULT_SEARCH_TYPES: PredictiveSearchTypes[] = [
  "COLLECTION",
  "PAGE",
  "PRODUCT",
  "QUERY",
];

/**
 * Fetches the search results from the predictive search API
 * requested by the SearchForm component
 */
export async function action({ request, params, context }: LoaderFunctionArgs) {
  if (request.method !== "POST") {
    return data(
      {
        searchResults: {
          results: NO_PREDICTIVE_SEARCH_RESULTS,
          totalResults: 0,
        },
        error: "Method not allowed",
      },
      { status: 405 },
    );
  }

  try {
    const search = await fetchPredictiveSearchResults({
      params,
      request,
      context,
    });

    return data(search);
  } catch (error) {
    console.error("Predictive search request failed", error);
    return data(
      {
        searchResults: {
          results: NO_PREDICTIVE_SEARCH_RESULTS,
          totalResults: 0,
        },
        error: "Search is temporarily unavailable",
      },
      { status: 503 },
    );
  }
}

async function fetchPredictiveSearchResults({
  params,
  request,
  context,
}: Pick<LoaderFunctionArgs, "params" | "context" | "request">) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  let body: FormData | null = null;
  try {
    body = await request.formData();
  } catch (error) {
    /* */
  }
  const searchTerm = String(body?.get("q") || searchParams.get("q") || "");
  const limit = Number(body?.get("limit") || searchParams.get("limit") || 10);
  const rawTypes = String(
    body?.get("type") || searchParams.get("type") || "ANY",
  );

  const searchTypes =
    rawTypes === "ANY"
      ? DEFAULT_SEARCH_TYPES
      : rawTypes
          .split(",")
          .map((t) => t.toUpperCase() as PredictiveSearchTypes)
          .filter((t) => DEFAULT_SEARCH_TYPES.includes(t));

  if (!searchTerm) {
    return {
      searchResults: { results: null, totalResults: 0 },
      searchTerm,
      searchTypes,
    };
  }

  const searchData = await context.storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      limit,
      limitScope: "EACH",
      searchTerm,
      types: searchTypes,
    },
  });

  if (!searchData) {
    throw new Error("No data returned from Shopify API");
  }

  const searchResults = normalizePredictiveSearchResults(
    searchData.predictiveSearch,
    params.locale,
    searchTerm,
  );

  return { searchResults, searchTerm, searchTypes };
}

/**
 * Normalize results and apply tracking query parameters to each result url
 */
function normalizePredictiveSearchResults(
  predictiveSearch: PredictiveSearchQuery["predictiveSearch"],
  locale: LoaderFunctionArgs["params"]["locale"],
  searchTerm: string,
): NormalizedPredictiveSearch {
  let totalResults = 0;
  if (!predictiveSearch) {
    return {
      results: NO_PREDICTIVE_SEARCH_RESULTS,
      totalResults,
    };
  }

  function createSearchParams(
    resource: PredictiveSearchResultItem | PredictiveQueryFragment,
    params?: URLSearchParams,
  ) {
    const searchParams = new URLSearchParams(params);
    if (resource.trackingParameters) {
      const trackingParams = new URLSearchParams(resource.trackingParameters);
      for (const [key, value] of trackingParams) {
        searchParams.append(key, value);
      }
    }
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  const localePrefix = locale ? `/${locale}` : "";
  const results: NormalizedPredictiveSearchResults = [];

  const matchingQueries = predictiveSearch.queries.filter((query) =>
    queryMatchesSearchTerm(query.text, searchTerm),
  );
  const queries = matchingQueries.length
    ? matchingQueries
    : [
        {
          __typename: "SearchQuerySuggestion" as const,
          text: searchTerm,
          styledText: `<b>${escapeHtml(searchTerm)}</b>`,
        },
      ];

  if (queries.length) {
    results.push({
      type: "queries",
      items: queries.map((query) => {
        totalResults += 1;
        return {
          __typename: query.__typename,
          handle: "",
          id: query.text,
          image: undefined,
          title: query.text,
          styledTitle: query.styledText,
          url: `${localePrefix}/search${createSearchParams(
            query,
            new URLSearchParams({ q: query.text }),
          )}`,
        };
      }),
    });
  }

  if (predictiveSearch.products.length) {
    results.push({
      type: "products",
      items: predictiveSearch.products.map(
        (product: PredictiveProductFragment) => {
          const selectedVariant = product.selectedOrFirstAvailableVariant;
          const optionsObject = mapSelectedProductOptionToObject(
            selectedVariant?.selectedOptions || [],
          );
          const productParams = new URLSearchParams(optionsObject);
          const productWithOptions = product as PredictiveProductWithOptions;
          const colorOption = productWithOptions.options?.find((option) =>
            ["color", "colour"].includes(option.name.toLocaleLowerCase()),
          );
          const selectedColor = selectedVariant?.selectedOptions.find(
            (option) =>
              ["color", "colour"].includes(option.name.toLocaleLowerCase()),
          )?.value;

          totalResults += 1;
          return {
            __typename: product.__typename,
            handle: product.handle,
            id: product.id,
            image: product.featuredImage,
            title: product.title,
            vendor: product.vendor,
            url: `${localePrefix}/products/${product.handle}${createSearchParams(
              product,
              productParams,
            )}`,
            price: selectedVariant?.price,
            compareAtPrice: selectedVariant?.compareAtPrice,
            ratingValue: (
              product as PredictiveProductFragment & {
                reviewRating?: { value?: string } | null;
              }
            ).reviewRating?.value,
            ratingCountValue: (
              product as PredictiveProductFragment & {
                reviewRatingCount?: { value?: string } | null;
              }
            ).reviewRatingCount?.value,
            swatches: colorOption?.optionValues.map((optionValue) => ({
              name: optionValue.name,
              color: optionValue.swatch?.color,
              image: optionValue.swatch?.image?.previewImage,
              selected: optionValue.name === selectedColor,
            })),
          };
        },
      ),
    });
  }

  if (predictiveSearch.collections.length) {
    results.push({
      type: "collections",
      items: predictiveSearch.collections.map(
        (collection: PredictiveCollectionFragment) => {
          totalResults += 1;
          return {
            __typename: collection.__typename,
            handle: collection.handle,
            id: collection.id,
            image: collection.image,
            title: collection.title,
            url: `${localePrefix}/collections/${collection.handle}${createSearchParams(collection)}`,
          };
        },
      ),
    });
  }

  if (predictiveSearch.pages.length) {
    results.push({
      type: "pages",
      items: predictiveSearch.pages.map((page: PredictivePageFragment) => {
        totalResults += 1;
        return {
          __typename: page.__typename,
          handle: page.handle,
          id: page.id,
          image: undefined,
          title: page.title,
          url: `${localePrefix}/pages/${page.handle}${createSearchParams(page)}`,
        };
      }),
    });
  }

  if (predictiveSearch.articles.length) {
    results.push({
      type: "articles",
      items: predictiveSearch.articles.map(
        (article: PredictiveArticleFragment) => {
          totalResults += 1;
          return {
            __typename: article.__typename,
            handle: article.handle,
            id: article.id,
            image: article.image,
            title: article.title,
            url: `${localePrefix}/blogs/${article.handle}${createSearchParams(article)}`,
          };
        },
      ),
    });
  }

  return { results, totalResults };
}

function queryMatchesSearchTerm(query: string, searchTerm: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  return searchTerm
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => normalizedQuery.includes(term));
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character,
  );
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    vendor
    reviewRating: metafield(namespace: "reviews", key: "rating") {
      value
    }
    reviewRatingCount: metafield(namespace: "reviews", key: "rating_count") {
      value
    }
    featuredImage {
      url
      altText
      width
      height
    }
    options {
      name
      optionValues {
        name
        swatch {
          color
          image {
            previewImage {
              url
              altText
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
    }
  }
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
  query predictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $searchTerm: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $searchTerm,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
` as const;
