import type { SeoConfig } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";
import type { ArticleQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { loadArticlePage } from "~/utils/article-page.server";
import { resolveArticleBlog } from "~/utils/blog.server";
import { articlePath, blogPath, blogSeoMeta } from "~/utils/blog-path";
import { routeHeaders } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader(args: LoaderFunctionArgs) {
  const { request, params, context } = args;
  const { storefront } = context.weaverse;
  const { language, country } = storefront.i18n;

  invariant(params.articleHandle, "Missing article handle");

  const { articleHandle } = params;
  const url = new URL(request.url);
  const requestedBlog = params.blogHandle ?? url.searchParams.get("blog");
  const blogHandle = await resolveArticleBlog(
    storefront,
    articleHandle,
    requestedBlog,
  );
  if (!blogHandle) {
    // Shopify's /blogs/:blogHandle listing aliases share the short article path.
    const { blog: listing } = await storefront.query(BLOG_ALIAS_QUERY, {
      variables: { handle: articleHandle, language },
    });
    if (!requestedBlog && listing) {
      const destination = new URL(blogPath(listing.handle), url);
      url.searchParams.set("blog", listing.handle);
      return redirect(
        `${params.locale ? `/${params.locale}` : ""}${destination.pathname}?${url.searchParams}`,
        301,
      );
    }
    throw new Response(null, { status: 404 });
  }

  const [{ blog }, weaverseData] = await Promise.all([
    storefront.query<ArticleQuery>(ARTICLE_QUERY, {
      variables: {
        blogHandle,
        articleHandle,
        language,
      },
    }),
    loadArticlePage(context, {
      blogHandle,
      articleHandle,
      locale: params.locale,
    }),
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, { status: 404 });
  }

  if (articleHandle !== blog.articleByHandle.handle) {
    // Replace the article segment only: its text may also occur in the locale
    // or parent blog. Keep Studio's full path and the request's query intact.
    const segments = url.pathname.split("/");
    const articleIndex = segments.length - (url.pathname.endsWith("/") ? 2 : 1);
    segments[articleIndex] = encodeURIComponent(blog.articleByHandle.handle);
    url.pathname = segments.join("/");
    throw redirect(url.toString());
  }

  const article = blog.articleByHandle;
  const relatedArticles = blog.articles.nodes.filter(
    (relatedArticle) => relatedArticle?.handle !== articleHandle,
  );

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(article.publishedAt));

  // Include the parent in canonical/share URLs, including legacy short requests.
  const articleUrl = new URL(
    articlePath(article.handle, blog.handle),
    request.url,
  );
  articleUrl.pathname = `${params.locale ? `/${params.locale}` : ""}${articleUrl.pathname}`;
  const seo = seoPayload.article({ article, url: articleUrl.toString() });

  return {
    article,
    blog: {
      handle: blog.handle,
    },
    relatedArticles,
    formattedDate,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return blogSeoMeta(
    localizedSeoMeta(matches, data?.seo as SeoConfig),
    data?.seo?.url,
  );
};

export default function Article() {
  return <WeaverseContent />;
}

const ARTICLE_QUERY = `#graphql
  query article(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      articleByHandle(handle: $articleHandle) {
        title
        handle
        contentHtml
        publishedAt
        tags
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
      articles(first: 20) {
        nodes {
          ...Article
        }
      }
    }
  }
  fragment Article on Article {
    blog { handle }
    tags
    author: authorV2 {
      name
    }
    contentHtml
    excerpt
    excerptHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
  }
` as const;

const BLOG_ALIAS_QUERY = `#graphql
  query MerchantBlogAlias($handle: String!, $language: LanguageCode) @inContext(language: $language) {
    blog(handle: $handle) { handle }
  }
` as const;
