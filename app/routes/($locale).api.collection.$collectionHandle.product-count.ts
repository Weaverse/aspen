import type { LoaderFunctionArgs } from "react-router";
import type { CollectionProductCountQuery } from "storefront-api.generated";
import { countCollectionProducts } from "~/utils/collection-product-count.server";

const COLLECTION_COUNT_QUERY = `#graphql
  query collectionProductCount(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $after: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250, after: $after) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
` as const;

export async function loader({ params, context }: LoaderFunctionArgs) {
  const handle = params.collectionHandle;
  if (!handle) {
    return Response.json({ count: 0 }, { status: 400 });
  }

  const { storefront } = context;
  const { country, language } = storefront.i18n;
  const count = await countCollectionProducts(async (after) => {
    const { collection } = await storefront.query<CollectionProductCountQuery>(
      COLLECTION_COUNT_QUERY,
      {
        cache: storefront.CacheLong(),
        variables: { country, language, handle, after },
      },
    );
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
