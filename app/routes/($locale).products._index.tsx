import { getPaginationVariables } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import invariant from "tiny-invariant";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { routeHeaders } from "~/utils/cache";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";
import { PAGINATION_SIZE } from "~/utils/const";
import {
  createLocalizedSeoConfig,
  getLocalizedMeta,
  getMetadataCopy,
} from "~/utils/metadata";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({
  request,
  context: { storefront, weaverse },
}: LoaderFunctionArgs) {
  const variables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
  });

  // Load products data and weaverseData in parallel
  const [data, weaverseData] = await Promise.all([
    storefront.query(ALL_PRODUCTS_QUERY, {
      variables: {
        ...variables,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        query: maybeFilterOutCombinedListingsQuery,
      },
    }),
    weaverse.loadPage({ type: "ALL_PRODUCTS" }),
  ]);

  invariant(data, "No data returned from Shopify API");
  const metadata = getMetadataCopy(request.url, "products");

  const seo = createLocalizedSeoConfig({
    locale: request.url,
    page: "products",
    seo: seoPayload.collection({
      url: request.url,
      collection: {
        id: "all-products",
        title: metadata.title,
        handle: "products",
        descriptionHtml: metadata.description,
        description: metadata.description,
        seo: {
          title: metadata.title,
          description: metadata.description,
        },
        metafields: [],
        products: data.products,
        updatedAt: "",
      },
    }),
  });

  return {
    products: data.products,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) =>
  getLocalizedMeta({ locale: params.locale, page: "products", seo: data?.seo });
export default function AllProducts() {
  return <WeaverseContent />;
}

const ALL_PRODUCTS_QUERY = `#graphql
  query allProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, query: $query) {
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
  ${PRODUCT_CARD_FRAGMENT}
` as const;
