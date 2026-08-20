import type { I18nBase } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";

export type Localizations = Record<string, I18nLocale>;

export type I18nLocale = I18nBase & {
  currency: CurrencyCode;
  label: string;
  pathPrefix: string;
  countryName?: string;
  languageName?: string;
};

export type StoreLocalization = {
  availableLocales: I18nLocale[];
  defaultLocale: I18nLocale;
  selectedLocale: I18nLocale;
};
