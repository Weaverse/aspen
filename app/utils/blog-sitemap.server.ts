import type { Storefront } from "@shopify/hydrogen";

// Keep each query's nested connection cost bounded (50 blogs × 10 lookups).
const BLOGS_PER_PAGE = 50;
const HANDLES_PER_QUERY = 10;

type LookupQuery = {
  blogs: {
    nodes: Array<{
      handle: string;
      [alias: `article${number}`]: { handle: string } | null;
    }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

/** Look up only this sitemap page's handles; never scan every article. */
export async function qualifyArticleSitemapItems(
  storefront: Storefront,
  resources: Array<{ handle: string; updatedAt: string }>,
) {
  const dates = new Map<string, Set<string>>();
  for (const { handle, updatedAt } of resources) {
    const values = dates.get(handle) ?? new Set<string>();
    values.add(updatedAt);
    dates.set(handle, values);
  }
  const handles = [...dates.keys()];
  const items: Array<{ handle: string; updatedAt?: string }> = [];
  for (let start = 0; start < handles.length; start += HANDLES_PER_QUERY) {
    const batch = handles.slice(start, start + HANDLES_PER_QUERY);
    const parents = batch.map(() => new Set<string>());
    const variables = Object.fromEntries(
      batch.map((handle, index) => [`handle${index}`, handle]),
    );
    const query = articleSitemapLookupQuery(batch.length);
    let cursor: string | null = null;
    do {
      const { blogs } = await storefront.query<LookupQuery>(query, {
        variables: { ...variables, cursor },
        cache: storefront.CacheLong(),
      });
      for (const blog of blogs.nodes) {
        batch.forEach((_handle, index) => {
          if (blog[`article${index}`]) {
            parents[index].add(blog.handle);
          }
        });
      }
      cursor = blogs.pageInfo.hasNextPage ? blogs.pageInfo.endCursor : null;
    } while (cursor);
    batch.forEach((handle, index) => {
      const timestamps = dates.get(handle);
      // Shopify omits blog identity from sitemap items, so a duplicate handle's
      // modification date cannot be attributed safely. lastmod is optional.
      const updatedAt =
        parents[index].size === 1 && timestamps.size === 1
          ? timestamps.values().next().value
          : undefined;
      for (const parent of parents[index]) {
        items.push({ handle: `${parent}/${handle}`, updatedAt });
      }
    });
  }
  return items;
}

/** Only generated alias/variable names enter the document; handles are variables. */
function articleSitemapLookupQuery(count: number) {
  const indices = Array.from({ length: count }, (_, index) => index);
  return `query ArticleSitemapParents($cursor: String, ${indices.map((index) => `$handle${index}: String!`).join(", ")}) {
    blogs(first: ${BLOGS_PER_PAGE}, after: $cursor) {
      nodes {
        handle
        ${indices.map((index) => `article${index}: articleByHandle(handle: $handle${index}) { handle }`).join("\n")}
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;
}
