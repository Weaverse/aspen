type SaleProduct = {
  selectedOrFirstAvailableVariant?: {
    price: { amount: string };
    compareAtPrice?: { amount: string } | null;
  } | null;
};

type PageVariables = {
  first?: number;
  last?: number;
  startCursor?: string | null;
  endCursor?: string | null;
};

type Connection<T> = {
  nodes: T[];
  edges: { cursor: string }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

// Match the variant whose price is shown on the product card.
export function isSaleProduct(product: SaleProduct) {
  const variant = product.selectedOrFirstAvailableVariant;
  return Boolean(
    variant?.compareAtPrice &&
      Number(variant.compareAtPrice.amount) > Number(variant.price.amount),
  );
}

/** Scan past non-matching products, including across source pages. One extra
 * match establishes whether there is another filtered page. Keep Shopify
 * cursors so forward and backward navigation use the same ordering. */
export async function paginateMatchingProducts<T, C extends Connection<T>>(
  initial: C,
  variables: PageVariables,
  fetchPage: (variables: PageVariables) => Promise<C>,
  matchesProduct: (product: C["nodes"][number]) => boolean,
): Promise<C> {
  const backwards = Boolean(variables.last);
  const size = variables.last ?? variables.first ?? 16;
  const matches: { node: T; cursor: string }[] = [];
  let page = initial;
  const visited = new Set<string>();

  while (true) {
    const entries = page.nodes.map((node, index) => ({
      node,
      cursor: page.edges[index].cursor,
    }));
    if (backwards) {
      entries.reverse();
    }
    for (const entry of entries) {
      if (matchesProduct(entry.node)) {
        matches.push(entry);
      }
      if (matches.length > size) {
        break;
      }
    }
    const hasMore = backwards
      ? page.pageInfo.hasPreviousPage
      : page.pageInfo.hasNextPage;
    const cursor = backwards
      ? page.pageInfo.startCursor
      : page.pageInfo.endCursor;
    if (matches.length > size || !hasMore) {
      break;
    }
    if (!cursor || visited.has(cursor)) {
      throw new Error("Filtered pagination did not advance");
    }
    visited.add(cursor);
    page = await fetchPage(
      backwards
        ? { last: size, startCursor: cursor }
        : { first: size, endCursor: cursor },
    );
  }

  const result = matches.slice(0, size);
  if (backwards) {
    result.reverse();
  }
  return {
    ...initial,
    nodes: result.map(({ node }) => node),
    edges: result.map(({ cursor }) => ({ cursor })),
    pageInfo: {
      hasPreviousPage: backwards
        ? matches.length > size
        : Boolean(variables.endCursor),
      hasNextPage: backwards
        ? Boolean(variables.startCursor)
        : matches.length > size,
      startCursor: result[0]?.cursor ?? null,
      endCursor: result.at(-1)?.cursor ?? null,
    },
  } as C;
}

export function paginateSaleProducts<
  T extends SaleProduct,
  C extends Connection<T>,
>(
  initial: C,
  variables: PageVariables,
  fetchPage: (variables: PageVariables) => Promise<C>,
): Promise<C> {
  return paginateMatchingProducts(initial, variables, fetchPage, isSaleProduct);
}
