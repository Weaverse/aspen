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
 * Only publish locales with a complete storefront translation catalog.
 * Shopify Markets must also publish a configured locale before it appears in
 * the production selector. Add another locale here only after its UI catalog
 * and locale navigation tests are complete.
 */
export const SUPPORTED_LOCALES: readonly I18nLocale[] = Object.freeze([
  DEFAULT_LOCALE,
]);
