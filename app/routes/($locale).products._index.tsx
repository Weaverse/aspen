import { gql, parseCollectionParams } from "@shopify/hydrogen";
import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect, useLoaderData } from "react-router";
import invariant from "tiny-invariant";
import { CollectionBrowseProvider } from "~/components/collection/browse";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type {
  AllProductsSaleProductScanQuery,
  SaleProductCardsQuery,
} from "~/graphql/storefront-types";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { getLegacyBrowseRedirect } from "~/utils/collection-browse";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";
import { PAGINATION_SIZE } from "~/utils/const";
import { getPaginationVariables } from "~/utils/pagination";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import {
  paginateSaleProducts,
  SALE_PRODUCT_CARDS_QUERY,
} from "~/utils/sale-pagination.server";
import { seoPayload } from "~/utils/seo.server";
import type { SeoConfig } from "~/utils/seo-meta";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({
  request,
  context: { storefront, weaverse },
}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const legacy = getLegacyBrowseRedirect(url);
  if (legacy) throw redirect(legacy, 301);
  const browse = parseCollectionParams(url.searchParams);
  const sortMap: Record<string, ProductSortKeys> = {
    COLLECTION_DEFAULT: "ID",
    MANUAL: "ID",
    CREATED: "CREATED_AT",
  };
  const browseVariables = {
    sortKey: sortMap[browse.sortKey] || (browse.sortKey as ProductSortKeys),
    reverse: browse.reverse,
  };
  const variables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
  });

  // Load products data and weaverseData in parallel
  const [data, weaverseData] = await Promise.all([
    storefront
      .graphql(ALL_PRODUCTS_QUERY, {
        variables: {
          ...variables,
          ...browseVariables,
          query: maybeFilterOutCombinedListingsQuery,
        },
        cache: CACHE_DEFAULT,
      })
      .then(unwrapStorefront),
    weaverse.loadPage({ type: "ALL_PRODUCTS" }),
  ]);

  invariant(data, "No data returned from Shopify API");

  if (new URL(request.url).searchParams.get("sale") === "true") {
    data.products = await paginateSaleProducts(
      data.products,
      variables,
      async (page) => {
        const next = await storefront
          .graphql(ALL_PRODUCTS_SALE_PRODUCT_SCAN_QUERY, {
            variables: {
              ...page,
              ...browseVariables,
              query: maybeFilterOutCombinedListingsQuery,
            },
            cache: CACHE_DEFAULT,
          })
          .then(unwrapStorefront);
        return next.products;
      },
      async (ids) => {
        const { nodes } = await storefront
          .graphql(SALE_PRODUCT_CARDS_QUERY, {
            variables: { ids },
            cache: CACHE_DEFAULT,
          })
          .then(unwrapStorefront);
        return nodes.filter(
          (node): node is Extract<NonNullable<typeof node>, { id: string }> =>
            Boolean(node && "id" in node),
        );
      },
    );
  }

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: "all-products",
      title: "seo.allProducts",
      handle: "products",
      descriptionHtml: "seo.allProductsDescription",
      description: "seo.allProductsDescription",
      seo: {
        title: "seo.allProducts",
        description: "seo.allProductsDescription",
      },
      metafields: [],
      products: data.products,
      updatedAt: "",
    },
  });

  return {
    products: data.products,
    dataSearch: url.search,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return localizedSeoMeta(matches, {
    ...data.seo,
    title: "seo.allProducts",
    description: "seo.allProductsDescription",
  } as SeoConfig);
};
export default function AllProducts() {
  const { dataSearch } = useLoaderData<typeof loader>();
  return (
    <CollectionBrowseProvider handle="all-products" dataSearch={dataSearch}>
      <WeaverseContent />
    </CollectionBrowseProvider>
  );
}

export const ALL_PRODUCTS_QUERY =
  gql(`query allProducts($country: CountryCode, $language: LanguageCode, $first: Int, $last: Int, $startCursor: String, $endCursor: String, $query: String
  $sortKey: ProductSortKeys
  $reverse: Boolean) @inContext(country: $country, language: $language) {
  products(
    first: $first
    last: $last
    before: $startCursor
    after: $endCursor
    query: $query
    sortKey: $sortKey
    reverse: $reverse
  ) {
    edges {
      cursor
    }
    nodes {
      ...ProductCard
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
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

export const ALL_PRODUCTS_SALE_PRODUCT_SCAN_QUERY =
  gql(`query allProductsSaleProductScan($country: CountryCode, $language: LanguageCode, $first: Int, $last: Int, $startCursor: String, $endCursor: String, $query: String
  $sortKey: ProductSortKeys
  $reverse: Boolean) @inContext(country: $country, language: $language) {
  products(
    first: $first
    last: $last
    before: $startCursor
    after: $endCursor
    query: $query
    sortKey: $sortKey
    reverse: $reverse
  ) {
    edges {
      cursor
    }
    nodes {
      id
      selectedOrFirstAvailableVariant(
        selectedOptions: []
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        price {
          amount
        }
        compareAtPrice {
          amount
        }
      }
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
  }
}`);
