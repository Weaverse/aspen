import type { I18nLocale } from "~/types/locale";

export const PAGINATION_SIZE = 16;

export const DEFAULT_BLOG_HANDLE = "aspen-blogs";

export const DEFAULT_LOCALE: I18nLocale = Object.freeze({
  label: "United States · English · USD",
  language: "EN",
  country: "US",
  currency: "USD",
  pathPrefix: "",
  countryName: "United States",
  languageName: "English",
});

/**
 * The only locale combinations supported by this storefront. In production,
 * Shopify Markets must also publish a locale before it appears in the
 * storefront selector. Weaverse Studio receives the complete matrix so
 * merchants can prepare translations before publishing a market.
 */
export const SUPPORTED_LOCALES: readonly I18nLocale[] = Object.freeze([
  DEFAULT_LOCALE,
  {
    label: "France · Français · EUR",
    language: "FR",
    country: "FR",
    currency: "EUR",
    pathPrefix: "/fr-fr",
    countryName: "France",
    languageName: "Français",
  },
  {
    label: "España · Español · EUR",
    language: "ES",
    country: "ES",
    currency: "EUR",
    pathPrefix: "/es-es",
    countryName: "España",
    languageName: "Español",
  },
]);
