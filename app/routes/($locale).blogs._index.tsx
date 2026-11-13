import { flattenConnection, gql } from "@shopify/hydrogen";
import type { MetaFunction } from "react-router";
import { data, type LoaderFunctionArgs } from "react-router";
import { resolveListingBlog } from "~/utils/blog.server";
import { blogPath, blogSeoMeta } from "~/utils/blog-path";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { PAGINATION_SIZE } from "~/utils/const";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import type { SeoConfig } from "~/utils/seo-meta";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const loader = async ({
  request,
  context,
  params,
}: LoaderFunctionArgs) => {
  const storefront = context.storefront;
  const { language, country } = storefront.i18n;
  const blogHandle = await resolveListingBlog(
    storefront,
    params.blogHandle ?? new URL(request.url).searchParams.get("blog"),
  );
  if (!blogHandle) {
    throw new Response("Not found", { status: 404 });
  }
  const { blog } = await storefront
    .graphql(BLOGS_INDEX_QUERY, {
      variables: {
        blogHandle,
        pageBy: PAGINATION_SIZE,
      },
      cache: CACHE_DEFAULT,
    })
    .then(unwrapStorefront);

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
  const canonical = new URL(request.url);
  if (params.blogHandle) {
    const path = new URL(blogPath(blog.handle), request.url);
    canonical.pathname = `${params.locale ? `/${params.locale}` : ""}${path.pathname}`;
    canonical.search = path.search;
  }
  const seo = seoPayload.blog({ blog, url: canonical.toString() });

  return data({ blog, articles, seo, weaverseData });
};

export const meta: MetaFunction<typeof loader> = ({
  data: loaderData,
  matches,
}) => {
  return blogSeoMeta(
    localizedSeoMeta(matches, loaderData?.seo as SeoConfig),
    loaderData?.seo?.url,
  );
};

export default function BlogsIndex() {
  return <WeaverseContent />;
}

export const BLOGS_INDEX_QUERY = gql(`
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
    blog { handle }
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
`);

export const BLOGS_INDEX_QUERY_BlogArticle =
  gql(`fragment BlogArticle on Article {
    blog { handle }
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
  }`);
