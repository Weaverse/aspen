import { WeaverseClient } from "@weaverse/hydrogen/react-router";
import type { AppLoadContext } from "react-router";

/** Keep parent identity in the CMS request even though SDK drops ordinary queries. */
export async function loadArticlePage(
  context: AppLoadContext & { weaverse: WeaverseClient },
  {
    blogHandle,
    articleHandle,
    locale,
  }: {
    blogHandle: string;
    articleHandle: string;
    locale?: string;
  },
) {
  const source = context.weaverse;
  const originalUrl = new URL(source.request.url);
  const url = new URL(originalUrl);
  url.pathname = `${locale ? `/${locale}` : ""}/blogs/${encodeURIComponent(blogHandle)}/${encodeURIComponent(articleHandle)}`;
  if (url.pathname === originalUrl.pathname) {
    return source.loadPage({ type: "ARTICLE", handle: articleHandle });
  }
  const scoped = new WeaverseClient({
    ...context,
    request: new Request(url, { headers: source.request.headers }),
    env: source.env,
    storefront: source.storefront,
    customerAccount: source.customerAccount,
    cache: source.cache,
    waitUntil: source.waitUntil,
    components: source.components,
    themeSchema: source.themeSchema,
    projectId: source.configs.projectId,
  });
  const data = await scoped.loadPage({
    type: "ARTICLE",
    handle: articleHandle,
  });
  if (!data) {
    return data;
  }
  // Only the CMS lookup uses the full path. Client/editor metadata describes
  // the URL actually visited, including its original locale and query params.
  return {
    ...data,
    configs: {
      ...data.configs,
      requestInfo: {
        ...data.configs.requestInfo,
        pathname: originalUrl.pathname,
        search: originalUrl.search,
      },
    },
  };
}
