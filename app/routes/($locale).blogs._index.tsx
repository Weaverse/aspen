import { flattenConnection } from "@shopify/hydrogen";
import type { MetaFunction } from "react-router";
import { data, type LoaderFunctionArgs } from "react-router";
import type { BlogsIndexQuery } from "storefront-api.generated";
import { routeHeaders } from "~/utils/cache";
import { DEFAULT_BLOG_HANDLE, PAGINATION_SIZE } from "~/utils/const";
import { getLocalizedMeta } from "~/utils/metadata";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const storefront = context.storefront;
  const { language, country } = storefront.i18n;
  const { blog } = await storefront.query<BlogsIndexQuery>(BLOGS_INDEX_QUERY, {
    variables: {
      blogHandle: DEFAULT_BLOG_HANDLE,
      pageBy: PAGINATION_SIZE,
      language,
    },
  });

  if (!blog) {
    throw new Response("Not found", { status: 404 });
  }

  const weaverseData = await context.weaverse.loadPage({
    type: "BLOG",
    handle: blog.handle,
  });
  const articles = flattenConnection(blog.articles).map((article) => {
    const { publishedAt } = article;
    return {
      ...article,
      publishedAtRaw: publishedAt,
      publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(publishedAt)),
    };
  });
  const seo = seoPayload.blog({ blog, url: request.url });

  return data({ blog, articles, seo, weaverseData });
};

export const meta: MetaFunction<typeof loader> = ({
  data: loaderData,
  params,
}) =>
  getLocalizedMeta({
    locale: params.locale,
    page: "blogs",
    seo: loaderData?.seo,
  });

export default function BlogsIndex() {
  return <WeaverseContent />;
}

const BLOGS_INDEX_QUERY = `#graphql
  query blogsIndex(
    $language: LanguageCode
    $blogHandle: String!
    $pageBy: Int!
    $cursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(first: $pageBy, after: $cursor) {
        edges {
          node {
            ...BlogArticle
          }
        }
      }
    }
  }

  fragment BlogArticle on Article {
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
    tags
    title
  }
` as const;
