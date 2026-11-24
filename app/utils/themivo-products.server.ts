import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { CacheShort } from "./cache";
import { unwrapStorefront } from "./storefront";
import type { AppLoadContext } from "react-router";
type ThemivoWishlistProductsQuery = StorefrontApi.ResultOf<
  typeof WISHLIST_PRODUCTS
>;
import type { ThemivoItem } from "~/types/wishlist";
import { productGid, variantGid } from "./themivo-wishlist.server";

const MAX_NODES_PER_QUERY = 250;

export async function hydrateThemivoItems(
  storefront: AppLoadContext["storefront"],
  items: ThemivoItem[],
  hiddenPrices: string[],
) {
  if (!items.length) {
    return [];
  }
  const ids = [
    ...new Set(
      items.flatMap((item) => [
        productGid(item.productId),
        ...(item.variantId ? [variantGid(item.variantId)] : []),
      ]),
    ),
  ];
  const nodes: ThemivoWishlistProductsQuery["nodes"] = [];
  for (let start = 0; start < ids.length; start += MAX_NODES_PER_QUERY) {
    const batch = unwrapStorefront(
      await storefront.graphql(WISHLIST_PRODUCTS, {
        variables: {
          ids: ids.slice(start, start + MAX_NODES_PER_QUERY),
        },
        cache: CacheShort(),
      }),
    );
    nodes.push(...batch.nodes);
  }
  const byId = new Map(
    nodes.flatMap((node) =>
      node && "id" in node ? [[node.id, node] as const] : [],
    ),
  );
  const hidden = new Set(hiddenPrices);
  return items.flatMap((item) => {
    const product = byId.get(productGid(item.productId));
    if (!product || !("handle" in product)) {
      return [];
    }
    const savedVariant = item.variantId
      ? byId.get(variantGid(item.variantId))
      : null;
    const variant = item.variantId
      ? savedVariant &&
        "availableForSale" in savedVariant &&
        savedVariant.product?.id === product.id
        ? savedVariant
        : null
      : product.selectedOrFirstAvailableVariant;
    return [
      {
        productId: product.id,
        variantId: item.variantId ? variantGid(item.variantId) : "",
        title: product.title,
        handle: product.handle,
        image:
          (savedVariant && "image" in savedVariant
            ? savedVariant.image
            : null) ?? product.featuredImage,
        selectedOptions:
          savedVariant && "selectedOptions" in savedVariant
            ? savedVariant.selectedOptions
            : undefined,
        price: hidden.has(item.productId) ? null : (variant?.price ?? null),
        compareAtPrice: hidden.has(item.productId)
          ? null
          : (variant?.compareAtPrice ?? null),
        merchandiseId:
          variant?.availableForSale && !product.requiresSellingPlan
            ? variant.id
            : null,
        quantity: item.quantity ?? 1,
      },
    ];
  });
}

export const WISHLIST_PRODUCTS = gql(`
  query ThemivoWishlistProducts($ids: [ID!]!)
 {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        requiresSellingPlan
        featuredImage { url altText width height }
        selectedOrFirstAvailableVariant {
          id
          availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
      ... on ProductVariant {
        id
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        product { id }
        image { url altText width height }
        selectedOptions { name value }
      }
    }
  }
`);

export async function themivoVariantBelongsToProduct(
  storefront: AppLoadContext["storefront"],
  variantId: string,
  productId: string,
) {
  const { node } = unwrapStorefront(
    await storefront.graphql(
      gql(`
    query ThemivoWishlistVariantProduct($id: ID!) {
      node(id: $id) {
        ... on ProductVariant { product { id } }
      }
    }
  `),
      { variables: { id: variantId }, cache: CacheShort() },
    ),
  );
  return Boolean(node && "product" in node && node.product.id === productId);
}

export async function readThemivoSuggestions(
  storefront: AppLoadContext["storefront"],
  collectionId: string,
  count: number,
  hiddenIds: string[],
) {
  const { collection } = unwrapStorefront(
    await storefront.graphql(
      gql(`
      query ThemivoWishlistSuggestions($id: ID!, $first: Int!)
     {
        collection(id: $id) {
          products(first: $first) {
            nodes {
              id
              title
              handle
              availableForSale
              featuredImage { url altText }
              selectedOrFirstAvailableVariant { id }
            }
          }
        }
      }
    `),
      {
        variables: {
          id: collectionId,
          first: count * 2,
        },
        cache: CacheShort(),
      },
    ),
  );
  const hidden = new Set(hiddenIds.map(productGid));
  return (collection?.products.nodes ?? [])
    .filter((product) => product.availableForSale && !hidden.has(product.id))
    .slice(0, count);
}
