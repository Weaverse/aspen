import type { RouteLoaderArgs } from "@weaverse/hydrogen";
import type { MetaFunction } from "react-router";
import { redirect } from "react-router";
import type { ArticleQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { routeHeaders } from "~/utils/cache";
import { DEFAULT_BLOG_HANDLE } from "~/utils/const";
import { getLocalizedMeta } from "~/utils/metadata";
import { redirectIfHandleIsLocalized } from "~/utils/redirect";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader(args: RouteLoaderArgs) {
  const { request, params, context } = args;
  const { storefront } = context.weaverse;
  const { language, country } = storefront.i18n;

  invariant(params.articleHandle, "Missing article handle");

  const { articleHandle } = params;
  if (articleHandle === DEFAULT_BLOG_HANDLE) {
    const localePrefix = params.locale ? `/${params.locale}` : "";
    return redirect(`${localePrefix}/blogs`, 301);
  }

  const [{ blog }, weaverseData] = await Promise.all([
    storefront.query<ArticleQuery>(ARTICLE_QUERY, {
      variables: {
        blogHandle: DEFAULT_BLOG_HANDLE,
        articleHandle,
        language,
      },
    }),
    context.weaverse.loadPage({
      type: "ARTICLE",
      handle: articleHandle,
    }),
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, { status: 404 });
  }

  redirectIfHandleIsLocalized(request, {
    handle: articleHandle,
    data: blog.articleByHandle,
  });

  const article = blog.articleByHandle;
  const relatedArticles = blog.articles.nodes.filter(
    (relatedArticle) => relatedArticle?.handle !== articleHandle,
  );

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(article.publishedAt));

  const seo = seoPayload.article({ article, url: request.url });

  return {
    article,
    blog: {
      handle: DEFAULT_BLOG_HANDLE,
    },
    relatedArticles,
    formattedDate,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) =>
  getLocalizedMeta({ locale: params.locale, page: "article", seo: data?.seo });

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
