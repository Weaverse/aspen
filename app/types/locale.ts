import type { I18nBase } from "@shopify/hydrogen";
import type {
  CountryCode,
  CurrencyCode,
} from "@shopify/hydrogen/storefront-api-types";

export type Localizations = Record<string, I18nLocale>;

export type I18nLocale = I18nBase & {
  currency: CurrencyCode;
  label: string;
  pathPrefix: string;
  countryName?: string;
  languageName?: string;
};

export type CurrencyOption = {
  country: CountryCode;
  countryName: string;
  currency: CurrencyCode;
  currencyName: string;
  label: string;
  symbol: string;
};

export type StoreLocalization = {
  availableLocales: I18nLocale[];
  availableCurrencies: CurrencyOption[];
  defaultLocale: I18nLocale;
  selectedMarketCountry: CountryCode;
  selectedLocale: I18nLocale;
};
