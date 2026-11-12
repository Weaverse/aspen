import {
  flattenConnection,
  gql,
  parseCollectionParams,
} from "@shopify/hydrogen";
import type {
  ProductCollectionSortKeys,
  ProductFilter,
} from "@shopify/hydrogen/storefront-api-types";
import {
  type LoaderFunctionArgs,
  type MetaArgs,
  redirect,
  useLoaderData,
} from "react-router";
import invariant from "tiny-invariant";
import {
  CollectionBrowseProvider,
  parseCategoryFilters,
} from "~/components/collection/browse";
import { Analytics } from "~/components/root/analytics";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import type {
  CollectionQuery,
  CollectionSaleProductScanQuery,
  SaleProductCardsQuery,
} from "~/graphql/storefront-types";
import type { I18nLocale } from "~/types/locale";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { getLegacyBrowseRedirect } from "~/utils/collection-browse";
import { PAGINATION_SIZE } from "~/utils/const";
import { FILTER_URL_PREFIX, type SortParam } from "~/utils/filter";
import { getPaginationVariables } from "~/utils/pagination";
import { redirectIfHandleIsLocalized } from "~/utils/redirect";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import {
  paginateSaleProducts,
  SALE_PRODUCT_CARDS_QUERY,
} from "~/utils/sale-pagination.server";
import { seoPayload } from "~/utils/seo.server";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const legacyRedirect = getLegacyBrowseRedirect(new URL(request.url));
  if (legacyRedirect) throw redirect(legacyRedirect, 301);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
  });
  const { collectionHandle } = params;
  const { storefront, env } = context;
  const locale = storefront.i18n;

  invariant(collectionHandle, "Missing collectionHandle param");

  const searchParams = new URL(request.url).searchParams;
  const browse = parseCollectionParams(searchParams);
  const { sortKey = "COLLECTION_DEFAULT", reverse } = browse;
  const filters: ProductFilter[] = [
    ...browse.filters,
    ...parseCategoryFilters(searchParams),
  ]
    .filter(
      (filter) =>
        (!filter.variantMetafield ||
          typeof filter.variantMetafield.value === "string") &&
        (!filter.productMetafield ||
          typeof filter.productMetafield.value === "string"),
    )
    .map((filter) => filter as ProductFilter);

  const { CUSTOM_COLLECTION_BANNER_METAFIELD = "" } = env;
  const [bannerNamespace = "", bannerKey = ""] =
    CUSTOM_COLLECTION_BANNER_METAFIELD.split(".");

  // Load collection data and weaverseData in parallel
  const [{ collection, collections }, weaverseData] = await Promise.all([
    storefront
      .graphql(COLLECTION_QUERY, {
        variables: {
          ...paginationVariables,
          handle: collectionHandle,
          filters,
          sortKey,
          reverse,
          customBannerNamespace: bannerNamespace,
          customBannerKey: bannerKey,
        },
        cache: CACHE_DEFAULT,
      })
      .then(unwrapStorefront),
    context.weaverse.loadPage({
      type: "COLLECTION",
      handle: collectionHandle,
    }),
  ]);

  if (!collection) {
    // @ts-expect-error
    if (paginationVariables.startCursor || paginationVariables.endCursor) {
      // remove the cursor from the url
      const url = new URL(request.url);
      url.searchParams.delete("after");
      url.searchParams.delete("before");
      url.searchParams.delete("cursor");
      url.searchParams.delete("direction");
      throw redirect(url.toString());
    }
    throw new Response("collection", { status: 404 });
  }
  redirectIfHandleIsLocalized(request, {
    handle: collectionHandle,
    data: collection,
  });

  const saleOnly = searchParams.get("sale") === "true";
  if (saleOnly) {
    collection.products = await paginateSaleProducts(
      collection.products,
      paginationVariables,
      async (page) => {
        const next = await storefront
          .graphql(COLLECTION_SALE_PRODUCT_SCAN_QUERY, {
            variables: {
              ...page,
              handle: collectionHandle,
              filters,
              sortKey,
              reverse,
            },
            cache: CACHE_DEFAULT,
          })
          .then(unwrapStorefront);
        if (!next.collection) {
          throw new Response("collection", { status: 404 });
        }
        return next.collection.products;
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
    collection: {
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      description: collection.description,
      seo: collection.seo,
      image: collection.image,
      products: {
        nodes: collection.products.nodes.map(({ handle }) => ({ handle })),
      },
    },
    url: request.url,
  });

  const allFilterValues = collection.products.filters.flatMap(
    (filter) => filter.values,
  );

  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find((value) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        // special case for price, the user can enter something freeform (still a number, though)
        // that may not make sense for the locale/currency.
        // Basically just check if the price filter is applied at all.
        if (valueInput.price && filter.price) {
          return true;
        }
        return (
          // This comparison should be okay as long as we're not manipulating the input we
          // get from the API before using it as a URL param.
          JSON.stringify(valueInput) === JSON.stringify(filter)
        );
      });
      if (!foundValue) {
        return null;
      }

      if (foundValue.id === "filter.v.price") {
        // Special case for price, we want to show the min and max values as the label.
        const input = filter;
        const min = parseAsCurrency(input.price?.min ?? 0, locale);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, locale)
          : "";
        const label = min && max ? `${min} - ${max}` : "Price";

        return {
          filter,
          label,
        };
      }
      return {
        filter,
        label: foundValue.label,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return {
    collection,
    dataSearch: new URL(request.url).search,
    appliedFilters,
    collections: flattenConnection(collections),
    seo,
    weaverseData,
  };
}

export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return localizedSeoMeta(
    matches,
    ...matches.map((match) => (match.data as any)?.seo).filter(Boolean),
  );
};

export default function Collection() {
  const { collection, dataSearch } = useLoaderData<typeof loader>();
  return (
    <>
      <CollectionBrowseProvider
        handle={collection.handle}
        dataSearch={dataSearch}
      >
        <WeaverseContent />
      </CollectionBrowseProvider>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </>
  );
}

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
} {
  switch (sortParam) {
    case "price-high-low":
      return {
        sortKey: "PRICE",
        reverse: true,
      };
    case "price-low-high":
      return {
        sortKey: "PRICE",
        reverse: false,
      };
    case "best-selling":
      return {
        sortKey: "BEST_SELLING",
        reverse: false,
      };
    case "newest":
      return {
        sortKey: "CREATED",
        reverse: true,
      };
    case "relevance":
      return {
        sortKey: "RELEVANCE",
        reverse: false,
      };
    default:
      return {
        sortKey: "MANUAL",
        reverse: false,
      };
  }
}

function parseFilterParam(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseAsCurrency(value: number, locale: I18nLocale) {
  return new Intl.NumberFormat(`${locale.language}-${locale.country}`, {
    style: "currency",
    currency: locale.currency,
  }).format(value);
}

export const COLLECTION_QUERY =
  gql(`query collection($handle: String!, $country: CountryCode, $language: LanguageCode, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys!, $reverse: Boolean, $first: Int, $last: Int, $startCursor: String, $endCursor: String, $customBannerNamespace: String!, $customBannerKey: String!) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    id
    handle
    title
    description
    seo {
      description
      title
    }
    metafield(namespace: $customBannerNamespace, key: $customBannerKey) {
      id
      type
      description
      value
      reference {
        ... on MediaImage {
          image {
            id
            url
          }
        }
      }
    }
    image {
      id
      url
      width
      height
      altText
    }
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      filters: $filters
      sortKey: $sortKey
      reverse: $reverse
    ) {
      filters {
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
      edges {
        cursor
      }
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
    highestPriceProduct: products(first: 1, sortKey: PRICE, reverse: true) {
      nodes {
        id
        title
        handle
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
    lowestPriceProduct: products(first: 1, sortKey: PRICE) {
      nodes {
        id
        title
        handle
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
  }
  collections(first: 100) {
    edges {
      node {
        title
        handle
      }
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

export const COLLECTION_SALE_PRODUCT_SCAN_QUERY =
  gql(`query collectionSaleProductScan($handle: String!, $country: CountryCode, $language: LanguageCode, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys!, $reverse: Boolean, $first: Int, $last: Int, $startCursor: String, $endCursor: String) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      filters: $filters
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
  }
}`);
