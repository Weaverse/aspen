import type { Storefront } from "@shopify/hydrogen";

/** An unqualified listing uses Shopify's first blog, never a theme/demo handle. */
export async function resolveListingBlog(
  storefront: Storefront,
  requested?: string | null,
) {
  if (requested) {
    return requested;
  }
  const { blogs } = await storefront.query(FIRST_BLOG_QUERY, {
    cache: storefront.CacheShort(),
  });
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
    const { blogs } = await storefront.query(ARTICLE_BLOGS_QUERY, {
      variables: { articleHandle, cursor, language: storefront.i18n.language },
      cache: storefront.CacheShort(),
    });
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

const FIRST_BLOG_QUERY = `#graphql
  query FirstMerchantBlog {
    blogs(first: 1) { nodes { handle } }
  }
` as const;

const ARTICLE_BLOGS_QUERY = `#graphql
  query ArticleParentBlogs($articleHandle: String!, $cursor: String, $language: LanguageCode)
  @inContext(language: $language) {
    blogs(first: 50, after: $cursor) {
      nodes { handle articleByHandle(handle: $articleHandle) { handle } }
      pageInfo { hasNextPage endCursor }
    }
  }
` as const;
