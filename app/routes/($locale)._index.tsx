import { gql } from "@shopify/hydrogen";
import {
  getWeaverseSeoMeta,
  type PageType,
} from "@weaverse/hydrogen/react-router";
import type { LoaderFunctionArgs, MetaArgs } from "react-router";
import type { ShopQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, CacheLong, routeHeaders } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import {
  localizedSeoMetaFromMatches,
  withWeaverseSeo,
} from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";
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
    context.storefront
      .graphql(SHOP_QUERY, { cache: CacheLong() })
      .then(unwrapStorefront),
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
      pageType: "home",
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

export const SHOP_QUERY =
  gql(`query shop($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
  shop {
    name
    description
  }
}`);
