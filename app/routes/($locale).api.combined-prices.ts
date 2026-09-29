import { CacheLong, createWithCache } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { data, type LoaderFunctionArgs } from "react-router";

type PriceRange = { minVariantPrice: MoneyV2; maxVariantPrice: MoneyV2 };
type AdminProduct = {
  id: string;
  combinedListing?: {
    combinedListingChildren: {
      nodes: Array<{ product: { id: string } }>;
    };
  } | null;
};
type StorefrontProduct = { id: string; priceRange: PriceRange };

const PRODUCT_ID = /^gid:\/\/shopify\/Product\/\d+$/;
const MAX_PRODUCTS = 20;
const ADMIN_GRAPHQL_URL = "https://studio.weaverse.io/api/admin-graphql";
const COMBINED_LISTING_CHILDREN_QUERY = `query CombinedPriceGroup($id: ID!) {
  node(id: $id) {
    ... on Product {
      id
      combinedListing {
        combinedListingChildren(first: 60) {
          nodes { product { id } }
        }
      }
    }
  }
}`;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const ids = [...new Set(new URL(request.url).searchParams.getAll("id"))];
  if (
    !ids.length ||
    ids.length > MAX_PRODUCTS ||
    ids.some((id) => !PRODUCT_ID.test(id))
  ) {
    return data({ error: "Invalid product IDs" }, { status: 400 });
  }

  const apiKey = context.env.WEAVERSE_API_KEY;
  if (!apiKey) {
    return data({ error: "Price ranges unavailable" }, { status: 503 });
  }

  try {
    const groups = new Map<string, string[]>();
    const withCache = createWithCache({
      cache: context.cache,
      waitUntil: context.waitUntil,
      request,
    });
    const groupEntries = await Promise.all(
      ids.map(async (id) => {
        const childIds = await withCache.run<string[] | null>(
          {
            cacheKey: ["combined-listing-children", id],
            cacheStrategy: CacheLong(),
            shouldCacheResult: () => true,
          },
          async ({ addDebugData }) => {
            const adminResponse = await fetch(ADMIN_GRAPHQL_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                query: COMBINED_LISTING_CHILDREN_QUERY,
                variables: { id },
              }),
              signal: AbortSignal.timeout(8000),
            });
            addDebugData({
              displayName: "Combined listing children",
              response: adminResponse,
            });
            if (!adminResponse.ok) {
              throw new Error("Combined listing children unavailable");
            }

            const adminData = (await adminResponse.json()) as {
              node?: AdminProduct | null;
              errors?: unknown[];
            };
            if (adminData.errors?.length || !adminData.node) {
              throw new Error("Combined listing children unavailable");
            }

            const children =
              adminData.node.combinedListing?.combinedListingChildren.nodes.map(
                (node) => node.product.id,
              );
            return children?.length ? children : null;
          },
        );
        return [id, childIds] as const;
      }),
    );

    for (const [id, childIds] of groupEntries) {
      if (childIds) {
        groups.set(id, childIds);
      }
    }

    if (!groups.size) {
      return data(
        { ranges: {} },
        { headers: { "Cache-Control": "private, max-age=300" } },
      );
    }

    const childIds = [...new Set([...groups.values()].flat())];
    const { nodes } = await context.storefront.query<{
      nodes: Array<StorefrontProduct | null>;
    }>(
      `#graphql
        query CombinedChildPrices($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
        @inContext(country: $country, language: $language) {
          nodes(ids: $ids) {
            ... on Product {
              id
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
            }
          }
        }
      `,
      {
        variables: {
          ids: childIds,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      },
    );

    const childPrices = new Map(
      nodes
        .filter((node): node is StorefrontProduct => Boolean(node))
        .map((node) => [node.id, node.priceRange]),
    );
    const ranges: Record<string, PriceRange> = {};
    for (const [productId, groupIds] of groups) {
      const prices = groupIds
        .map((id) => childPrices.get(id))
        .filter((price): price is PriceRange => Boolean(price));
      if (prices.length !== groupIds.length) {
        continue;
      }
      const currency = prices[0].minVariantPrice.currencyCode;
      if (
        prices.some(
          (price) =>
            price.minVariantPrice.currencyCode !== currency ||
            price.maxVariantPrice.currencyCode !== currency,
        )
      ) {
        continue;
      }
      ranges[productId] = {
        minVariantPrice: prices.reduce(
          (min, price) =>
            Number(price.minVariantPrice.amount) < Number(min.amount)
              ? price.minVariantPrice
              : min,
          prices[0].minVariantPrice,
        ),
        maxVariantPrice: prices.reduce(
          (max, price) =>
            Number(price.maxVariantPrice.amount) > Number(max.amount)
              ? price.maxVariantPrice
              : max,
          prices[0].maxVariantPrice,
        ),
      };
    }

    return data(
      { ranges },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch {
    return data({ error: "Price ranges unavailable" }, { status: 502 });
  }
}
