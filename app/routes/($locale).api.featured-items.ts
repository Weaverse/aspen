import { gql } from "@shopify/hydrogen";
import { data, type LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type { FeaturedItemsQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT } from "~/utils/cache";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";
import { unwrapStorefront } from "~/utils/storefront";

export async function loader({ context: { storefront } }: LoaderFunctionArgs) {
  return data(await getFeaturedData(storefront));
}

export async function getFeaturedData(
  storefront: LoaderFunctionArgs["context"]["storefront"],
  variables: { pageBy?: number } = {},
) {
  const featuredItemsData = await storefront
    .graphql(FEATURED_ITEMS_QUERY, {
      variables: {
        pageBy: 12,
        query: maybeFilterOutCombinedListingsQuery,
        ...variables,
      },
      cache: CACHE_DEFAULT,
    })
    .then(unwrapStorefront);

  invariant(
    featuredItemsData,
    "No featured items data returned from Shopify API",
  );

  return featuredItemsData;
}

export type FeaturedData = Awaited<ReturnType<typeof getFeaturedData>>;

export const FEATURED_ITEMS_QUERY =
  gql(`query featuredItems($country: CountryCode, $language: LanguageCode, $pageBy: Int = 12, $query: String) @inContext(country: $country, language: $language) {
  featuredProducts: products(first: $pageBy, sortKey: BEST_SELLING, query: $query) {
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
