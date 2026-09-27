import { AnalyticsPageType } from "@shopify/hydrogen";
import { getWeaverseSeoMeta, type PageType } from "@weaverse/hydrogen";
import type { LoaderFunctionArgs, MetaArgs } from "react-router";
import type { ShopQuery } from "storefront-api.generated";
import { routeHeaders } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import {
  localizedSeoMetaFromMatches,
  withWeaverseSeo,
} from "~/utils/seo-translation";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader(args: LoaderFunctionArgs) {
  const { params, context } = args;
  const { pathPrefix } = context.storefront.i18n;
  const locale = pathPrefix.slice(1);
  let type: PageType = "INDEX";

  if (params.locale && params.locale.toLowerCase() !== locale) {
    // Update for Weaverse: if it not locale, it probably is a custom page handle
    type = "CUSTOM";
  }

  // Load async data in parallel for better performance
  const [weaverseData, { shop }] = await Promise.all([
    context.weaverse.loadPage({ type }),
    context.storefront.query<ShopQuery>(SHOP_QUERY, {
      cache: context.storefront.CacheLong(),
    }),
  ]);

  // Check weaverseData after parallel loading
  validateWeaverseData(weaverseData);

  // Match Pilot: the real homepage uses the connected shop name while a
  // root-level custom page uses the SEO authored for that Weaverse page.
  const seo = type === "INDEX" ? seoPayload.home({ shop }) : null;

  return {
    shop,
    weaverseData,
    analytics: {
      pageType: AnalyticsPageType.home,
    },
    seo,
  };
}

export const meta = ({ data, matches }: MetaArgs<typeof loader>) => {
  const routeSeo = localizedSeoMetaFromMatches(matches);
  return data?.seo
    ? routeSeo
    : withWeaverseSeo(routeSeo, getWeaverseSeoMeta(data?.weaverseData));
};
export default function Homepage() {
  return <WeaverseContent />;
}

const SHOP_QUERY = `#graphql
  query shop($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      name
      description
    }
  }
` as const;
