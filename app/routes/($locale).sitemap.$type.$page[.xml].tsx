import { getSitemap, type Storefront } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { articlePath, blogPath } from "~/utils/blog-path";
import { qualifyArticleSitemapItems } from "~/utils/blog-sitemap.server";

type SitemapQueryData = {
  sitemap?: {
    resources?: { items: Array<{ handle: string; updatedAt: string }> };
  };
};

export async function loader({
  request,
  params,
  context: { storefront },
}: LoaderFunctionArgs) {
  const storefrontClient: Storefront = storefront;
  const sitemapStorefront = {
    ...storefront,
    query: (async (query, options) => {
      const result = await storefrontClient.query<SitemapQueryData>(
        query,
        options,
      );
      if (params.type === "articles" && result?.sitemap?.resources?.items) {
        return {
          ...result,
          sitemap: {
            ...result.sitemap,
            resources: {
              ...result.sitemap.resources,
              items: await qualifyArticleSitemapItems(
                storefrontClient,
                result.sitemap.resources.items,
              ),
            },
          },
        };
      }
      return result;
    }) as Storefront["query"],
  };
  const response = await getSitemap({
    storefront: sitemapStorefront,
    request,
    params,
    locales: ["EN-US", "EN-CA", "FR-CA"],
    getLink: ({ type, baseUrl, handle, locale }) => {
      const prefix = locale ? `/${locale.toLowerCase()}` : "";
      if (type === "blogs") {
        return `${baseUrl}${prefix}${blogPath(handle)}`;
      }
      if (type === "articles") {
        const [blogHandle, ...articleHandle] = handle.split("/");
        return `${baseUrl}${prefix}${articlePath(articleHandle.join("/"), blogHandle)}`;
      }
      if (!locale) {
        return `${baseUrl}/${type}/${handle}`;
      }
      return `${baseUrl}/${locale}/${type}/${handle}`;
    },
  });

  response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

  if (params.type === "articles") {
    // Hydrogen always emits lastmod, even when the source cannot identify a
    // duplicate handle's timestamp. Omit that optional tag rather than invent it.
    const xml = (await response.text()).replace(
      /\s*<lastmod>undefined<\/lastmod>/g,
      "",
    );
    return new Response(xml, {
      status: response.status,
      headers: response.headers,
    });
  }
  return response;
}
