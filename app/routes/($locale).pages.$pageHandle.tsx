import { gql } from "@shopify/hydrogen";
import type { RouteLoaderArgs } from "@weaverse/hydrogen/react-router";
import { type MetaFunction, redirect } from "react-router";
import invariant from "tiny-invariant";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { redirectIfHandleIsLocalized } from "~/utils/redirect";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import type { SeoConfig } from "~/utils/seo-meta";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
import { canonicalStorefrontPathname } from "~/utils/storefront-path";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ request, params, context }: RouteLoaderArgs) {
  invariant(params.pageHandle, "Missing page handle");
  const requestUrl = new URL(request.url);
  const canonicalPath = canonicalStorefrontPathname(requestUrl.pathname);
  if (
    params.pageHandle === "contact" &&
    canonicalPath !== requestUrl.pathname
  ) {
    throw redirect(`${canonicalPath}${requestUrl.search}`, 301);
  }

  const { storefront } = context.weaverse;

  // Load page data and weaverseData in parallel
  const [{ page }, weaverseData] = await Promise.all([
    storefront
      .graphql(PAGE_QUERY, {
        variables: { handle: params.pageHandle },
        cache: CACHE_DEFAULT,
      })
      .then(unwrapStorefront),
    context.weaverse.loadPage({
      type: "PAGE",
      handle: params.pageHandle,
    }),
  ]);

  if (!page) {
    throw new Response(null, { status: 404 });
  }
  redirectIfHandleIsLocalized(request, {
    handle: params.pageHandle,
    data: page,
  });

  const seo = seoPayload.page({ page, url: request.url });

  return {
    page,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return localizedSeoMeta(matches, data?.seo as SeoConfig);
};

export default function Page() {
  return <WeaverseContent />;
}

export const PAGE_QUERY =
  gql(`query PageDetails($language: LanguageCode, $handle: String!) @inContext(language: $language) {
  page(handle: $handle) {
    id
    title
    handle
    body
    seo {
      description
      title
    }
  }
}`);
