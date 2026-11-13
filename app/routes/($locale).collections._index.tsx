import { gql } from "@shopify/hydrogen";
import type { RouteLoaderArgs } from "@weaverse/hydrogen/react-router";
import type { MetaFunction } from "react-router";
import type { CollectionsQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { getPaginationVariables } from "~/utils/pagination";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import type { SeoConfig } from "~/utils/seo-meta";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
import { WeaverseContent } from "~/weaverse";

const COLLECTIONS_PER_PAGE = 6;

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const loader = async (args: RouteLoaderArgs) => {
  const {
    request,
    context: { weaverse },
  } = args;
  const storefront = weaverse.storefront;
  const variables = getPaginationVariables(request, {
    pageBy: COLLECTIONS_PER_PAGE,
  });

  // Load collections data and weaverseData in parallel
  const [{ collections }, weaverseData] = await Promise.all([
    storefront
      .graphql(COLLECTIONS_QUERY, {
        variables: { ...variables },
        cache: CACHE_DEFAULT,
      })
      .then(unwrapStorefront),
    weaverse.loadPage({
      type: "COLLECTION_LIST",
    }),
  ]);

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return {
    collections,
    seo,
    weaverseData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return localizedSeoMeta(matches, data?.seo as SeoConfig);
};

export default function Collections() {
  return <WeaverseContent />;
}

export const COLLECTIONS_QUERY =
  gql(`query collections($country: CountryCode, $language: LanguageCode, $first: Int, $last: Int, $startCursor: String, $endCursor: String) @inContext(country: $country, language: $language) {
  collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
    nodes {
      id
      title
      description
      handle
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(first: 3) {
        nodes {
          id
          title
          handle
          media(first: 1) {
            nodes {
              previewImage {
                id
                url
                width
                height
                altText
              }
            }
          }
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
