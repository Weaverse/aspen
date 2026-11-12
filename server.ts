import * as serverBuild from "virtual:react-router/server-build";
import { handleShopifyRedirects, handleShopifyRoutes } from "@shopify/hydrogen";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { cartHandlers } from "~/.server/cart";
import { createAppLoadContext } from "~/.server/context";
import { getCustomerAccountHandlers } from "~/.server/customer-account";
import { marketAwareRedirect } from "~/.server/market-redirect";
import {
  getCanonicalLocaleRedirect,
  getLocaleSegment,
  localeCode,
  stripLocalePrefix,
} from "~/utils/locale";
import { routeTemplates } from "~/utils/route-templates";
import { defaultTranslation } from "~/utils/translation";

export { createAppLoadContext };

const handleRequest = createRequestHandler(serverBuild, process.env.NODE_ENV);
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (
        url.protocol === "http:" &&
        request.headers.get("x-forwarded-proto") === "https"
      ) {
        url.protocol = "https:";
        request = new Request(url, request);
      }
      if (
        (request.method === "GET" || request.method === "HEAD") &&
        request.body
      )
        return new Response("Invalid request body", { status: 400 });
      if (url.pathname.includes("//"))
        return Response.redirect(
          new URL(url.pathname.replace(/\/{2,}/g, "/") + url.search, url),
          301,
        );
      const context = await createAppLoadContext(
        request,
        env,
        executionContext,
      );
      const canonical = getCanonicalLocaleRedirect(
        request,
        context.localization,
      );
      if (canonical)
        return Response.redirect(new URL(canonical, request.url), 302);
      const market = getLocaleSegment(url.pathname);
      const unsupportedMarket = Boolean(
        market &&
          !context.localization.availableLocales.some(
            (locale) => localeCode(locale) === market,
          ),
      );
      const neutralPath = stripLocalePrefix(url.pathname);
      const resourcePath =
        /^\/(?:api\/|sitemap(?:\/|\.xml)|discount\/|cart\/|account\/(?:login|authorize|refresh|logout))/.test(
          neutralPath,
        );
      if (
        unsupportedMarket &&
        (resourcePath || !["GET", "HEAD"].includes(request.method))
      )
        return new Response(null, { status: 404 });
      const { storefront, session } = context;
      const isCartPermalink =
        /^\/cart\/[^/]+:\d+/.test(url.pathname) &&
        !url.searchParams.has("payment");
      const owned = isCartPermalink
        ? null
        : handleShopifyRoutes({
            request,
            requestContext: storefront.requestContext,
            storefrontClient: storefront,
            sessionManager: session,
            routeTemplates,
            handlers: [cartHandlers, getCustomerAccountHandlers(env)],
          });
      let response = owned
        ? await owned
        : await handleRequest(
            request,
            Object.assign(new RouterContextProvider(), context),
          );
      if (response.status === 404 && !unsupportedMarket) {
        const redirected = await marketAwareRedirect(request, (lookupRequest) =>
          handleShopifyRedirects({
            request: lookupRequest,
            storefrontClient: storefront,
            routeTemplates,
          }),
        );
        if (redirected) response = redirected;
      }

      const headers = new Headers((await session.commit()) ?? undefined);
      for (const [name, value] of headers) response.headers.append(name, value);
      storefront.requestContext.applyResponseHeaders(response.headers);
      // Aspen still streams cart/wishlist/account data from the root loader.
      // Those documents and currency-session responses must stay private.
      if (
        /(?:^|;\s*)(?:cart|session)=/.test(request.headers.get("Cookie") || "")
      ) {
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("Oxygen-Cache-Control", "no-store");
      }
      return response;
    } catch (error) {
      if (error instanceof Response) return error;
      console.error(error);
      return new Response(defaultTranslation("errors.unexpected"), {
        status: 500,
      });
    }
  },
};
