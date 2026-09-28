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
const GROUP_CACHE_MS = 5 * 60 * 1000;
const groupCache = new Map<
  string,
  { childIds: string[] | null; expiresAt: number }
>();

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
    const uncachedIds: string[] = [];
    for (const id of ids) {
      const cached = groupCache.get(id);
      if (!cached || cached.expiresAt <= Date.now()) {
        uncachedIds.push(id);
      } else if (cached.childIds) {
        groups.set(id, cached.childIds);
      }
    }

    if (uncachedIds.length) {
      const adminResponse = await fetch(
        "https://studio.weaverse.io/api/admin-graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: `query CombinedPriceGroups($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                combinedListing {
                  combinedListingChildren(first: 60) {
                    nodes { product { id } }
                  }
                }
              }
            }
          }`,
            variables: { ids: uncachedIds },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!adminResponse.ok) {
        return data({ error: "Price ranges unavailable" }, { status: 502 });
      }

      const adminData = (await adminResponse.json()) as {
        nodes?: Array<AdminProduct | null>;
        errors?: unknown[];
      };
      if (adminData.errors?.length || !adminData.nodes) {
        return data({ error: "Price ranges unavailable" }, { status: 502 });
      }

      for (const product of adminData.nodes) {
        if (!product || !uncachedIds.includes(product.id)) {
          continue;
        }
        const childIds =
          product.combinedListing?.combinedListingChildren.nodes.map(
            (node) => node.product.id,
          );
        groupCache.set(product.id, {
          childIds: childIds?.length ? childIds : null,
          expiresAt: Date.now() + GROUP_CACHE_MS,
        });
        if (childIds?.length) {
          groups.set(product.id, childIds);
        }
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
