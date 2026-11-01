import type { Storefront } from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import type {
  ProductCardFragment,
  SearchVisibleIndexQuery,
} from "storefront-api.generated";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type { I18nLocale } from "~/types/locale";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
} from "./combined-listings";

type SearchIndexProduct = Pick<
  ProductCardFragment,
  "id" | "tags" | "priceRange"
>;
type SearchIndex = {
  products: {
    nodes: SearchIndexProduct[];
    filters: SearchVisibleIndexQuery["products"]["filters"];
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

// Shopify search exposes at most 1,000 matches. Read only lightweight metadata
// in batches, then fetch full cards for the visible page (not the entire index).
const SEARCH_LIMIT = 1000;
const INDEX_BATCH_SIZE = 250;

export function paginateSearch<T>(
  nodes: T[],
  pagination: {
    first?: number | null;
    last?: number | null;
    startCursor?: string | null;
    endCursor?: string | null;
  },
) {
  const cursor = pagination.endCursor ?? pagination.startCursor;
  const match = cursor?.match(/^visible:(\d+)$/);
  const size = pagination.first ?? pagination.last ?? 8;
  let offset = match ? Math.min(Number(match[1]), nodes.length) : 0;
  if (!pagination.last && nodes.length && offset >= nodes.length) {
    offset = Math.floor((nodes.length - 1) / size) * size;
  }
  const start = pagination.last ? Math.max(0, offset - size) : offset;
  const end = Math.min(start + size, nodes.length);
  return {
    nodes: nodes.slice(start, end),
    totalCount: nodes.length,
    pageInfo: {
      startCursor: `visible:${start}`,
      endCursor: `visible:${end}`,
      hasPreviousPage: start > 0,
      hasNextPage: end < nodes.length,
    },
  };
}

export async function searchVisibleProducts(
  storefront: Storefront<I18nLocale>,
  variables: {
    searchTerm: string;
    filters: ProductFilter[];
    sortKey: "PRICE" | "RELEVANCE";
    reverse: boolean;
  },
  pagination: Parameters<typeof paginateSearch>[1],
) {
  const { nodes, filters } = await readSearchIndex(storefront, variables);
  const visible = nodes.filter(
    (product) =>
      !COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList ||
      !isCombinedListing(product),
  );
  const page = paginateSearch(visible, pagination);
  const cards = page.nodes.length
    ? await storefront.query<{ nodes: (ProductCardFragment | null)[] }>(
        SEARCH_CARDS_QUERY,
        {
          variables: { ids: page.nodes.map((product) => product.id) },
          cache: storefront.CacheShort(),
        },
      )
    : { nodes: [] };
  // Preserve search relevance/price ordering even if the node lookup changes order.
  const byId = new Map(
    cards.nodes
      .filter((product): product is ProductCardFragment => Boolean(product))
      .map((product) => [product.id, product]),
  );
  const priceNodes = variables.filters.length
    ? (
        await readSearchIndex(storefront, { ...variables, filters: [] })
      ).nodes.filter(
        (product) =>
          !COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList ||
          !isCombinedListing(product),
      )
    : visible;
  const lowest = [...priceNodes].sort(
    (a, b) =>
      Number(a.priceRange.minVariantPrice.amount) -
      Number(b.priceRange.minVariantPrice.amount),
  );
  const highest = [...priceNodes].sort(
    (a, b) =>
      Number(b.priceRange.maxVariantPrice.amount) -
      Number(a.priceRange.maxVariantPrice.amount),
  );
  return {
    products: {
      ...page,
      filters,
      nodes: page.nodes.flatMap((product) => byId.get(product.id) ?? []),
    },
    lowestPriceProduct: { nodes: lowest.slice(0, 1) },
    highestPriceProduct: { nodes: highest.slice(0, 1) },
  };
}

async function readSearchIndex(
  storefront: Storefront<I18nLocale>,
  variables: Parameters<typeof searchVisibleProducts>[1],
) {
  const nodes: SearchIndexProduct[] = [];
  let filters: SearchVisibleIndexQuery["products"]["filters"] = [];
  let after: string | null = null;
  for (let batch = 0; batch < SEARCH_LIMIT / INDEX_BATCH_SIZE; batch += 1) {
    const response: SearchIndex = await storefront.query<SearchIndex>(
      SEARCH_INDEX_QUERY,
      {
        variables: { ...variables, after, first: INDEX_BATCH_SIZE },
        cache: storefront.CacheShort(),
      },
    );
    filters = response.products.filters;
    nodes.push(...response.products.nodes);
    if (!response.products.pageInfo.hasNextPage) {
      break;
    }
    const next = response.products.pageInfo.endCursor;
    if (!next || next === after) {
      throw new Error("Search pagination did not advance");
    }
    after = next;
  }
  return { nodes, filters };
}

const SEARCH_INDEX_QUERY = `#graphql
  query SearchVisibleIndex($searchTerm: String!, $filters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean, $after: String, $first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products: search(query: $searchTerm, types: [PRODUCT], productFilters: $filters, sortKey: $sortKey, reverse: $reverse, after: $after, first: $first) {
      nodes { ... on Product { id tags priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } } }
      filters: productFilters { id label type values { id label count input } }
      pageInfo { hasNextPage endCursor }
    }
  }
` as const;

const SEARCH_CARDS_QUERY = `#graphql
  query SearchVisibleCards($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) { ... on Product { ...ProductCard } }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

export type SearchConnection = Awaited<
  ReturnType<typeof searchVisibleProducts>
>["products"];
