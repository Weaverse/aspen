export const COLLECTION_COUNT_PAGE_SIZE = 250;
export const MAX_COLLECTION_COUNT_REQUESTS = 8;
export const MAX_COLLECTION_PRODUCT_COUNT =
  COLLECTION_COUNT_PAGE_SIZE * MAX_COLLECTION_COUNT_REQUESTS;

type CollectionCountPage = {
  size: number;
  hasNextPage: boolean;
  endCursor: string | null;
} | null;

export async function countCollectionProducts(
  fetchPage: (after: string | null) => Promise<CollectionCountPage>,
): Promise<number | string> {
  let count = 0;
  let after: string | null = null;

  for (let request = 0; request < MAX_COLLECTION_COUNT_REQUESTS; request += 1) {
    const page = await fetchPage(after);
    if (!page) {
      return count;
    }

    count += page.size;
    if (!page.hasNextPage) {
      return count;
    }
    if (!page.endCursor || page.endCursor === after) {
      return `${count}+`;
    }
    after = page.endCursor;
  }

  return `${MAX_COLLECTION_PRODUCT_COUNT}+`;
}
