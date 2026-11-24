import { gql } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import type { CollectionProductCountQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, CacheLong } from "~/utils/cache";
import { countCollectionProducts } from "~/utils/collection-product-count.server";
import { unwrapStorefront } from "~/utils/storefront";

export const COLLECTION_COUNT_QUERY =
  gql(`query collectionProductCount($country: CountryCode, $language: LanguageCode, $handle: String!, $after: String) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    products(first: 250, after: $after) {
      nodes {
        id
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`);

export async function loader({ params, context }: LoaderFunctionArgs) {
  const handle = params.collectionHandle;
  if (!handle) {
    return Response.json({ count: 0 }, { status: 400 });
  }

  const { storefront } = context;
  const { country, language } = storefront.i18n;
  const count = await countCollectionProducts(async (after) => {
    const { collection } = await storefront
      .graphql(COLLECTION_COUNT_QUERY, {
        cache: CacheLong(),
        variables: { handle, after },
      })
      .then(unwrapStorefront);
    if (!collection) {
      return null;
    }

    const { nodes, pageInfo } = collection.products;
    return {
      size: nodes.length,
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor ?? null,
    };
  });
  return Response.json({ count });
}
