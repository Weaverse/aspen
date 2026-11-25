import { gql } from "@shopify/hydrogen";
import type { Storefront } from "~/.server/storefront";
import { CacheShort } from "~/utils/cache";
import { unwrapStorefront } from "~/utils/storefront";

/** An unqualified listing uses Shopify's first blog, never a theme/demo handle. */
export async function resolveListingBlog(
  storefront: Storefront,
  requested?: string | null,
) {
  if (requested) {
    return requested;
  }
  const { blogs } = await storefront
    .graphql(FIRST_BLOG_QUERY, {
      cache: CacheShort(),
    })
    .then(unwrapStorefront);
  return blogs.nodes[0]?.handle ?? null;
}

/** Legacy short article URLs are safe only when one blog owns the handle. */
export async function resolveArticleBlog(
  storefront: Storefront,
  articleHandle: string,
  requested?: string | null,
) {
  if (requested) {
    return requested;
  }
  let cursor: string | null = null;
  let match: string | null = null;
  do {
    const { blogs } = await storefront
      .graphql(ARTICLE_BLOGS_QUERY, {
        variables: {
          articleHandle,
          cursor,
        },
        cache: CacheShort(),
      })
      .then(unwrapStorefront);
    for (const blog of blogs.nodes) {
      if (blog.articleByHandle) {
        if (match !== null) {
          // Never guess which merchant's article an ambiguous legacy URL means.
          throw new Response("Article URL requires a blog", { status: 404 });
        }
        match = blog.handle;
      }
    }
    cursor = blogs.pageInfo.hasNextPage ? blogs.pageInfo.endCursor : null;
  } while (cursor);
  return match;
}

export const FIRST_BLOG_QUERY = gql(`
  query FirstMerchantBlog {
    blogs(first: 1) { nodes { handle } }
  }
`);

export const ARTICLE_BLOGS_QUERY = gql(`
  query ArticleParentBlogs($articleHandle: String!, $cursor: String, $language: LanguageCode)
  @inContext(language: $language) {
    blogs(first: 50, after: $cursor) {
      nodes { handle articleByHandle(handle: $articleHandle) { handle } }
      pageInfo { hasNextPage endCursor }
    }
  }
`);
