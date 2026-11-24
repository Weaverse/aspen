import { gql, type StorefrontApi } from "@shopify/hydrogen";
import type { Storefront } from "~/.server/storefront";
import { CacheLong } from "~/utils/cache";
import { unwrapStorefront } from "~/utils/storefront";

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
    ) as StorefrontApi.VariablesOf<typeof ARTICLE_SITEMAP_PARENTS_QUERY>;
    const query = ARTICLE_SITEMAP_PARENTS_QUERY;
    for (let index = batch.length; index < HANDLES_PER_QUERY; index++) {
      variables[`handle${index}`] = "";
    }
    let cursor: string | null = null;
    do {
      const { blogs } = await storefront
        .graphql(query, {
          variables: { ...variables, cursor },
          cache: CacheLong(),
        })
        .then(unwrapStorefront);
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

export const ARTICLE_SITEMAP_PARENTS_QUERY = gql(
  `query ArticleSitemapParents($cursor: String, $handle0: String!, $handle1: String!, $handle2: String!, $handle3: String!, $handle4: String!, $handle5: String!, $handle6: String!, $handle7: String!, $handle8: String!, $handle9: String!) { blogs(first: 50, after: $cursor) { nodes { handle article0: articleByHandle(handle: $handle0) { handle } article1: articleByHandle(handle: $handle1) { handle } article2: articleByHandle(handle: $handle2) { handle } article3: articleByHandle(handle: $handle3) { handle } article4: articleByHandle(handle: $handle4) { handle } article5: articleByHandle(handle: $handle5) { handle } article6: articleByHandle(handle: $handle6) { handle } article7: articleByHandle(handle: $handle7) { handle } article8: articleByHandle(handle: $handle8) { handle } article9: articleByHandle(handle: $handle9) { handle } } pageInfo { hasNextPage endCursor } } }`,
);
