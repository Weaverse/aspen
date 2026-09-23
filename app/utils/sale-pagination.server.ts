import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";

export type SaleProduct = {
  id: string;
  selectedOrFirstAvailableVariant?: {
    price: { amount: string };
    compareAtPrice?: { amount: string } | null;
  } | null;
};

export type SalePageVariables = {
  first?: number;
  last?: number;
  startCursor?: string | null;
  endCursor?: string | null;
};

export type ProductConnection<T> = {
  nodes: T[];
  edges: { cursor: string }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

const SALE_SCAN_PAGE_SIZE = 250;
const MAX_SALE_SCAN_REQUESTS = 4;

export const SALE_PRODUCT_CARDS_QUERY = `#graphql
  query saleProductCards(
    $country: CountryCode
    $language: LanguageCode
    $ids: [ID!]!
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

// Match the variant whose price is shown on the product card.
export function isSaleProduct(product: SaleProduct) {
  const variant = product.selectedOrFirstAvailableVariant;
  return Boolean(
    variant?.compareAtPrice &&
      Number(variant.compareAtPrice.amount) > Number(variant.price.amount),
  );
}

type SaleMatch<T> = {
  id: string;
  cursor: string;
  product?: T;
};

/**
 * Build one filtered sale page without repeatedly fetching full product cards.
 * The initial page already contains card data; follow-up scans fetch only IDs,
 * cursors and prices in batches of 250, then hydrate the visible matches once.
 */
export async function paginateSaleProducts<
  T extends SaleProduct,
  C extends ProductConnection<T>,
>(
  initial: C,
  variables: SalePageVariables,
  scanPage: (
    variables: SalePageVariables,
  ) => Promise<ProductConnection<SaleProduct>>,
  hydrateProducts: (ids: string[]) => Promise<T[]>,
): Promise<C> {
  const backwards = Boolean(variables.last);
  const size = variables.last ?? variables.first ?? 16;
  const matches: SaleMatch<T>[] = [];
  const visited = new Set<string>();
  let pageInfo = initial.pageInfo;
  let scanRequests = 0;

  const collectMatches = <P extends SaleProduct>(
    page: ProductConnection<P>,
    includeProduct: boolean,
  ) => {
    const entries = page.nodes.map((product, index) => ({
      product,
      cursor: page.edges[index]?.cursor,
    }));
    if (backwards) {
      entries.reverse();
    }
    for (const entry of entries) {
      if (entry.cursor && isSaleProduct(entry.product)) {
        matches.push({
          id: entry.product.id,
          cursor: entry.cursor,
          product: includeProduct ? (entry.product as unknown as T) : undefined,
        });
      }
      if (matches.length > size) {
        break;
      }
    }
  };

  collectMatches(initial, true);

  while (matches.length <= size) {
    const hasMore = backwards ? pageInfo.hasPreviousPage : pageInfo.hasNextPage;
    if (!hasMore || scanRequests >= MAX_SALE_SCAN_REQUESTS) {
      break;
    }

    const cursor = backwards ? pageInfo.startCursor : pageInfo.endCursor;
    if (!cursor || visited.has(cursor)) {
      throw new Error("Sale pagination did not advance");
    }
    visited.add(cursor);

    const page = await scanPage(
      backwards
        ? { last: SALE_SCAN_PAGE_SIZE, startCursor: cursor }
        : { first: SALE_SCAN_PAGE_SIZE, endCursor: cursor },
    );
    scanRequests += 1;
    pageInfo = page.pageInfo;
    collectMatches(page, false);
  }

  const hasMoreSourceProducts = backwards
    ? pageInfo.hasPreviousPage
    : pageInfo.hasNextPage;
  const hasUnscannedProducts =
    matches.length <= size &&
    hasMoreSourceProducts &&
    scanRequests >= MAX_SALE_SCAN_REQUESTS;
  const selectedMatches = matches.slice(0, size);
  const idsToHydrate = selectedMatches
    .filter((match) => !match.product)
    .map((match) => match.id);
  const hydratedProducts = idsToHydrate.length
    ? await hydrateProducts(idsToHydrate)
    : [];
  const hydratedById = new Map(
    hydratedProducts.map((product) => [product.id, product]),
  );
  const results = selectedMatches.flatMap((match) => {
    const product = match.product ?? hydratedById.get(match.id);
    return product ? [{ ...match, product }] : [];
  });
  if (backwards) {
    results.reverse();
  }

  return {
    ...initial,
    nodes: results.map(({ product }) => product),
    edges: results.map(({ cursor }) => ({ cursor })),
    pageInfo: {
      hasPreviousPage: backwards
        ? matches.length > size || hasUnscannedProducts
        : Boolean(variables.endCursor),
      hasNextPage: backwards
        ? Boolean(variables.startCursor)
        : matches.length > size || hasUnscannedProducts,
      startCursor:
        backwards && hasUnscannedProducts
          ? pageInfo.startCursor
          : (results[0]?.cursor ?? null),
      endCursor:
        !backwards && hasUnscannedProducts
          ? pageInfo.endCursor
          : (results.at(-1)?.cursor ?? null),
    },
  } as C;
}
