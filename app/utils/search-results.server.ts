import { gql } from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import type { Storefront } from "~/.server/storefront";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type {
  ProductCardFragment,
  SearchVisibleIndexQuery,
} from "~/graphql/storefront-types";
import type { I18nLocale } from "~/types/locale";
import { CACHE_DEFAULT, CacheShort } from "~/utils/cache";
import { unwrapStorefront } from "~/utils/storefront";
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
const FACET_BATCH_SIZE = 8;
const FACET_PAGE_SIZE = 100;

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
  storefront: Storefront,
  variables: {
    searchTerm: string;
    filters: ProductFilter[];
    sortKey: "PRICE" | "RELEVANCE";
    reverse: boolean;
  },
  pagination: Parameters<typeof paginateSearch>[1],
) {
  const index = await readSearchIndex(storefront, variables);
  const { nodes, filters } = index;
  const visible = nodes.filter(
    (product) =>
      !COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList ||
      !isCombinedListing(product),
  );
  const page = paginateSearch(visible, pagination);
  const cards = page.nodes.length
    ? await storefront
        .graphql(SEARCH_CARDS_QUERY, {
          variables: { ids: page.nodes.map((product) => product.id) },
          cache: CacheShort(),
        })
        .then(unwrapStorefront)
    : { nodes: [] };
  // Preserve search relevance/price ordering even if the node lookup changes order.
  const byId = new Map(
    cards.nodes
      .filter((product): product is ProductCardFragment => Boolean(product))
      .map((product) => [product.id, product]),
  );
  const unfiltered = variables.filters.length
    ? await readSearchIndex(storefront, { ...variables, filters: [] })
    : index;
  const priceNodes = unfiltered.nodes.filter(
    (product) =>
      !COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList ||
      !isCombinedListing(product),
  );
  const visibleFilters =
    COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList &&
    (!unfiltered.complete ||
      unfiltered.nodes.some(isCombinedListing) ||
      nodes.some(isCombinedListing))
      ? await countVisibleFacets(storefront, variables, filters)
      : filters;
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
      filters: visibleFilters,
      nodes: page.nodes.flatMap((product) => byId.get(product.id) ?? []),
    },
    lowestPriceProduct: { nodes: lowest.slice(0, 1) },
    highestPriceProduct: { nodes: highest.slice(0, 1) },
  };
}

// Keep Shopify's keyword parser and product-filter matching as the source of
// truth. Only correct facets when hidden listings can affect their counts.
async function countVisibleFacets(
  storefront: Storefront,
  variables: Parameters<typeof searchVisibleProducts>[1],
  filters: SearchIndex["products"]["filters"],
) {
  const corrected = filters.map((filter) => ({
    ...filter,
    values: filter.values.map((value) => ({ ...value })),
  }));
  const pending = corrected.flatMap((filter) =>
    filter.type === "PRICE_RANGE"
      ? []
      : filter.values.filter((value) => value.count > 0),
  );
  // Batch lightweight, keyword-preserving probes instead of making one HTTP
  // request per value. Bound both query size and pagination like the main index.
  for (let offset = 0; offset < pending.length; offset += FACET_BATCH_SIZE) {
    let active = pending
      .slice(offset, offset + FACET_BATCH_SIZE)
      .map((value) => {
        const input = (
          typeof value.input === "string"
            ? JSON.parse(value.input)
            : value.input
        ) as ProductFilter;
        value.count = 0;
        return {
          value,
          after: null as string | null,
          filters: [
            ...variables.filters.filter(
              (filter) => filterGroup(filter) !== filterGroup(input),
            ),
            input,
          ],
        };
      });
    for (
      let page = 0;
      active.length && page < SEARCH_LIMIT / FACET_PAGE_SIZE;
      page += 1
    ) {
      const response = await storefront
        .graphql(FACET_COUNT_QUERY, {
          variables: {
            searchTerm: variables.searchTerm,
            sortKey: variables.sortKey,
            reverse: variables.reverse,
            ...Object.fromEntries(
              active.flatMap((task, index) => [
                [`filters${index}`, task.filters],
                [`after${index}`, task.after],
                [`enabled${index}`, true],
              ]),
            ),
          },
          cache: CacheShort(),
        })
        .then(unwrapStorefront);
      active = active.filter((task, index) => {
        const result = response[`facet${index}`];
        task.value.count += result.nodes.filter(
          (product) => !isCombinedListing(product),
        ).length;
        if (!result.pageInfo.hasNextPage) {
          return false;
        }
        const next = result.pageInfo.endCursor;
        if (!next || next === task.after) {
          throw new Error("Search facet pagination did not advance");
        }
        task.after = next;
        return true;
      });
    }
  }
  return corrected;
}

const FACET_COUNT_QUERY =
  gql(`query SearchVisibleFacetCounts($searchTerm: String!, $sortKey: SearchSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode, $filters0: [ProductFilter!], $after0: String, $enabled0: Boolean = false, $filters1: [ProductFilter!], $after1: String, $enabled1: Boolean = false, $filters2: [ProductFilter!], $after2: String, $enabled2: Boolean = false, $filters3: [ProductFilter!], $after3: String, $enabled3: Boolean = false, $filters4: [ProductFilter!], $after4: String, $enabled4: Boolean = false, $filters5: [ProductFilter!], $after5: String, $enabled5: Boolean = false, $filters6: [ProductFilter!], $after6: String, $enabled6: Boolean = false, $filters7: [ProductFilter!], $after7: String, $enabled7: Boolean = false) @inContext(country: $country, language: $language) {
  facet0: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters0
    sortKey: $sortKey
    reverse: $reverse
    after: $after0
    first: 100
  ) @include(if: $enabled0) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet1: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters1
    sortKey: $sortKey
    reverse: $reverse
    after: $after1
    first: 100
  ) @include(if: $enabled1) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet2: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters2
    sortKey: $sortKey
    reverse: $reverse
    after: $after2
    first: 100
  ) @include(if: $enabled2) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet3: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters3
    sortKey: $sortKey
    reverse: $reverse
    after: $after3
    first: 100
  ) @include(if: $enabled3) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet4: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters4
    sortKey: $sortKey
    reverse: $reverse
    after: $after4
    first: 100
  ) @include(if: $enabled4) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet5: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters5
    sortKey: $sortKey
    reverse: $reverse
    after: $after5
    first: 100
  ) @include(if: $enabled5) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet6: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters6
    sortKey: $sortKey
    reverse: $reverse
    after: $after6
    first: 100
  ) @include(if: $enabled6) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  facet7: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters7
    sortKey: $sortKey
    reverse: $reverse
    after: $after7
    first: 100
  ) @include(if: $enabled7) {
    nodes {
      ... on Product {
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`);

function filterGroup(filter: ProductFilter) {
  return JSON.stringify(
    Object.entries(filter).map(([key, value]) => [
      key,
      value && typeof value === "object"
        ? ["namespace", "key", "name"].map((field) => value[field])
        : null,
    ]),
  );
}

async function readSearchIndex(
  storefront: Storefront,
  variables: Parameters<typeof searchVisibleProducts>[1],
) {
  const nodes: SearchIndexProduct[] = [];
  let filters: SearchVisibleIndexQuery["products"]["filters"] = [];
  let after: string | null = null;
  let complete = false;
  for (let batch = 0; batch < SEARCH_LIMIT / INDEX_BATCH_SIZE; batch += 1) {
    const raw = await storefront
      .graphql(SEARCH_INDEX_QUERY, {
        variables: { ...variables, after, first: INDEX_BATCH_SIZE },
        cache: CacheShort(),
      })
      .then(unwrapStorefront);
    const response: SearchIndex = {
      ...raw,
      products: {
        ...raw.products,
        nodes: raw.products.nodes.filter(
          (
            node,
          ): node is Extract<NonNullable<typeof node>, { tags: string[] }> =>
            Boolean(node && "tags" in node),
        ),
      },
    };
    filters = response.products.filters;
    nodes.push(...response.products.nodes);
    complete = !response.products.pageInfo.hasNextPage;
    if (complete) {
      break;
    }
    const next = response.products.pageInfo.endCursor;
    if (!next || next === after) {
      throw new Error("Search pagination did not advance");
    }
    after = next;
  }
  return { nodes, filters, complete };
}

export const SEARCH_INDEX_QUERY =
  gql(`query SearchVisibleIndex($searchTerm: String!, $filters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean, $after: String, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
  products: search(
    query: $searchTerm
    types: [PRODUCT]
    productFilters: $filters
    sortKey: $sortKey
    reverse: $reverse
    after: $after
    first: $first
  ) {
    nodes {
      ... on Product {
        id
        tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
    filters: productFilters {
      id
      label
      type
      values {
        id
        label
        count
        input
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`);

export const SEARCH_CARDS_QUERY =
  gql(`query SearchVisibleCards($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
  nodes(ids: $ids) {
    ... on Product {
      ...ProductCard
    }
  }
}

fragment ProductCard on Product {
  id
  title
  publishedAt
  handle
  vendor
  productType
  tags
  reviewRating: metafield(namespace: "reviews", key: "rating") {
    value
  }
  reviewRatingCount: metafield(namespace: "reviews", key: "rating_count") {
    value
  }
  images(first: 50) {
    nodes {
      id
      url
      altText
      width
      height
    }
  }
  options {
    ...ProductOption
  }
  badges: metafields(identifiers: [{namespace: "custom", key: "best_seller"}]) {
    key
    namespace
    value
  }
  priceRange {
    maxVariantPrice {
      amount
      currencyCode
    }
    minVariantPrice {
      amount
      currencyCode
    }
  }
  selectedOrFirstAvailableVariant(
    selectedOptions: []
    ignoreUnknownOptions: true
    caseInsensitiveMatch: true
  ) {
    ...ProductVariant
  }
  isBundle: selectedOrFirstAvailableVariant(
    ignoreUnknownOptions: true
    selectedOptions: {name: "", value: ""}
  ) {
    ... on ProductVariant {
      requiresComponents
    }
  }
}

fragment ProductOption on ProductOption {
  name
  optionValues {
    name
    firstSelectableVariant {
      ...ProductVariant
    }
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

fragment ProductVariant on ProductVariant {
  currentlyNotInStock
  requiresShipping
  quantityRule {
    minimum
    maximum
    increment
  }
  id
  availableForSale
  quantityAvailable
  selectedOptions {
    name
    value
  }
  image {
    id
    url
    altText
    width
    height
  }
  price {
    amount
    currencyCode
  }
  compareAtPrice {
    amount
    currencyCode
  }
  sku
  title
  unitPrice {
    amount
    currencyCode
  }
  product {
    id
    vendor
    title
    handle
  }
  requiresComponents
  components(first: 10) {
    nodes {
      productVariant {
        id
        title
        product {
          handle
        }
      }
      quantity
    }
  }
  groupedBy(first: 10) {
    nodes {
      id
      title
      product {
        handle
      }
    }
  }
}`);

export type SearchConnection = Awaited<
  ReturnType<typeof searchVisibleProducts>
>["products"];
