import { gql } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import invariant from "tiny-invariant";
import type { Storefront } from "~/.server/storefront";
import type { MappedProductOptions } from "~/components/product/product-form";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type { ProductRecommendationsQuery } from "~/graphql/storefront-types";
import type { I18nLocale } from "~/types/locale";
import { CACHE_DEFAULT } from "~/utils/cache";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";
import { unwrapStorefront } from "~/utils/storefront";

export function isNewArrival(date: string, daysOld = 30) {
  return (
    new Date(date).valueOf() >
    new Date().setDate(new Date().getDate() - daysOld).valueOf()
  );
}

export function isDiscounted(price: MoneyV2, compareAtPrice: MoneyV2) {
  if (compareAtPrice?.amount > price?.amount) {
    return true;
  }
  return false;
}

export async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront
    .graphql(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {
        productId,
        count: 12,
        query: maybeFilterOutCombinedListingsQuery,
      },
      cache: CACHE_DEFAULT,
    })
    .then(unwrapStorefront);

  invariant(products, "No data returned from Shopify API");

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter((prod, idx, arr) => {
      return arr.findIndex(({ id }) => id === prod.id) === idx;
    });

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return { nodes: mergedProducts };
}

export const RECOMMENDED_PRODUCTS_QUERY =
  gql(`query productRecommendations($productId: ID!, $count: Int, $country: CountryCode, $language: LanguageCode, $query: String) @inContext(country: $country, language: $language) {
  recommended: productRecommendations(productId: $productId) {
    ...ProductCard
  }
  additional: products(first: $count, sortKey: BEST_SELLING, query: $query) {
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

export function hasOnlyDefaultVariant(
  productOptions: MappedProductOptions[] = [],
) {
  if (productOptions.length === 1) {
    const option = productOptions[0];
    if (option.name === "Title" && option.optionValues.length === 1) {
      const optionValue = option.optionValues[0];
      return optionValue.name === "Default Title";
    }
  }
  return false;
}
