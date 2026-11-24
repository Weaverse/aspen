import { gql } from "@shopify/hydrogen";
import { MEDIA_FRAGMENT, PRODUCT_OPTION_FRAGMENT } from "~/graphql/fragments";

export const PRODUCT_QUERY =
  gql(`query product($country: CountryCode, $language: LanguageCode, $handle: String!, $selectedOptions: [SelectedOptionInput!]!) @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    id
    title
    vendor
    handle
    publishedAt
    descriptionHtml
    description
    summary: description(truncateAt: 200)
    encodedVariantExistence
    encodedVariantAvailability
    tags
    featuredImage {
      id
      url
      altText
    }
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
    badges: metafields(identifiers: [{namespace: "custom", key: "best_seller"}]) {
      key
      namespace
      value
    }
    reviewRating: metafield(namespace: "reviews", key: "rating") {
      value
    }
    reviewRatingCount: metafield(namespace: "reviews", key: "rating_count") {
      value
    }
    options {
      ...ProductOption
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    isBundle: selectedOrFirstAvailableVariant(
      ignoreUnknownOptions: true
      selectedOptions: {name: "", value: ""}
    ) {
      ... on ProductVariant {
        requiresComponents
        components(first: 100) {
          nodes {
            productVariant {
              ...ProductVariant
            }
            quantity
          }
        }
        groupedBy(first: 100) {
          nodes {
            id
          }
        }
      }
    }
    media(first: 50) {
      nodes {
        ...Media
      }
    }
    sellingPlanGroups(first: 10) {
      edges {
        node {
          name
          sellingPlans(first: 20) {
            edges {
              node {
                id
                name
                description
                recurringDeliveries
                options {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
    seo {
      description
      title
    }
  }
  shop {
    name
    primaryDomain {
      url
    }
    shippingPolicy {
      body
      handle
    }
    refundPolicy {
      body
      handle
    }
  }
}

fragment Media on Media {
  __typename
  mediaContentType
  alt
  previewImage {
    id
    url
    altText
    width
    height
  }
  ... on MediaImage {
    id
    image {
      id
      url
      width
      height
    }
  }
  ... on Video {
    id
    sources {
      mimeType
      url
    }
  }
  ... on Model3d {
    id
    sources {
      mimeType
      url
    }
  }
  ... on ExternalVideo {
    id
    embedUrl
    host
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

export type ProductQuery = import("@shopify/hydrogen").StorefrontApi.ResultOf<
  typeof PRODUCT_QUERY
>;
