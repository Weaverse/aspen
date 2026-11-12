import { getSitemap } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { localeCode } from "~/utils/locale";
import { canonicalStorefrontPathname } from "~/utils/storefront-path";

export async function loader({
  request,
  params,
  context: { storefront, localization },
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    locales: localization.availableLocales.map((locale) =>
      localeCode(locale).toUpperCase(),
    ),
    getLink: ({ type, baseUrl, handle, locale }) => {
      const prefix =
        localization.availableLocales.find(
          (candidate) => localeCode(candidate) === locale?.toLowerCase(),
        )?.pathPrefix ?? "";
      const pathname = canonicalStorefrontPathname(
        `${prefix}/${type}/${handle}`,
      );
      return `${baseUrl}${pathname}`;
    },
  });

  response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

  return response;
}
