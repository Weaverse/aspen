import { flattenConnection, gql } from "@shopify/hydrogen";
import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";
import { data, type LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type { ApiAllProductsQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, CacheLong } from "~/utils/cache";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { unwrapStorefront } from "~/utils/storefront";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

/**
 * Fetch a given set of products from the storefront API
 * @param count
 * @param query
 * @param reverse
 * @param sortKey
 * @returns Product[]
 * @see https://shopify.dev/api/storefront/current/queries/products
 */
export async function loader({
  request,
  context: { storefront },
}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const query = searchParams.get("query") ?? "";
  const sortKey =
    (searchParams.get("sortKey") as null | ProductSortKeys) ?? "BEST_SELLING";
  let reverse = false;

  try {
    const _reverse = searchParams.get("reverse");
    if (_reverse === "true") {
      reverse = true;
    }
  } catch (_) {
    // noop
  }

  let count = 4;
  try {
    const _count = searchParams.get("count");
    if (typeof _count === "string") {
      count = Number.parseInt(_count, 10);
    }
  } catch (_) {
    // noop
  }

  const combinedQuery = [maybeFilterOutCombinedListingsQuery, query]
    .filter(Boolean)
    .join(" ");

  const { products } = await storefront
    .graphql(API_ALL_PRODUCTS_QUERY, {
      variables: { count, query: combinedQuery, reverse, sortKey },
      cache: CacheLong(),
    })
    .then(unwrapStorefront);

  invariant(products, "No data returned from top products query");

  return data({ products: flattenConnection(products) });
}

export const API_ALL_PRODUCTS_QUERY =
  gql(`query ApiAllProducts($query: String, $count: Int, $reverse: Boolean, $country: CountryCode, $language: LanguageCode, $sortKey: ProductSortKeys) @inContext(country: $country, language: $language) {
  products(first: $count, sortKey: $sortKey, reverse: $reverse, query: $query) {
    nodes {
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
