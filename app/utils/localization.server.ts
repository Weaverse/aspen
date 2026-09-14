import type { Storefront } from "@shopify/hydrogen";
import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from "@shopify/hydrogen/storefront-api-types";
import type {
  CurrencyOption,
  I18nLocale,
  StoreLocalization,
} from "~/types/locale";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "~/utils/const";
import {
  getLocaleSegment,
  includeDefaultLocale,
  localeCode,
  localePathPrefix,
  selectSupportedLiveLocales,
} from "~/utils/locale";

type LocalizationQueryData = {
  localization: {
    country: {
      isoCode: CountryCode;
      name: string;
      currency: {
        isoCode: CurrencyCode;
        name: string;
        symbol: string;
      };
    };
    language: {
      isoCode: LanguageCode;
      name: string;
      endonymName?: string | null;
    };
    availableLanguages: Array<{
      isoCode: LanguageCode;
      name: string;
      endonymName?: string | null;
    }>;
    availableCountries: Array<{
      isoCode: CountryCode;
      name: string;
      currency: {
        isoCode: CurrencyCode;
        name: string;
        symbol: string;
      };
      availableLanguages: Array<{
        isoCode: LanguageCode;
        name: string;
        endonymName?: string | null;
      }>;
    }>;
  };
};

export async function loadStoreLocalization(
  storefront: Storefront,
  request: Request,
): Promise<StoreLocalization> {
  try {
    const { localization } = await storefront.query<LocalizationQueryData>(
      LOCALIZATION_QUERY,
      {
        cache: storefront.CacheLong(),
        variables: {
          country: storefront.i18n.country,
          language: storefront.i18n.language,
        },
      },
    );

    const liveLocales = localization.availableCountries.flatMap((country) => {
      const countryLanguages =
        country.isoCode === localization.country.isoCode
          ? mergeLanguages(
              country.availableLanguages,
              localization.availableLanguages,
            )
          : country.availableLanguages;

      return countryLanguages.map<I18nLocale>((language) => ({
        label: `${country.name} · ${language.endonymName || language.name} · ${country.currency.isoCode}`,
        language: language.isoCode,
        country: country.isoCode,
        currency: country.currency.isoCode,
        pathPrefix: localePathPrefix({
          language: language.isoCode,
          country: country.isoCode,
        }),
        countryName: country.name,
        languageName: language.endonymName || language.name,
      }));
    });

    const supportedLiveLocales = selectSupportedLiveLocales(
      liveLocales,
      SUPPORTED_LOCALES,
    );
    const defaultLocale =
      supportedLiveLocales.find(
        (locale) => localeCode(locale) === localeCode(DEFAULT_LOCALE),
      ) ?? DEFAULT_LOCALE;
    const liveAvailableLocales = includeDefaultLocale(
      supportedLiveLocales,
      defaultLocale,
    );
    const availableLocales = isWeaverseDesignMode(request)
      ? [...SUPPORTED_LOCALES]
      : liveAvailableLocales;
    const requestedCode = getLocaleSegment(new URL(request.url).pathname);
    const selectedLanguageLocale =
      availableLocales.find((locale) => localeCode(locale) === requestedCode) ??
      defaultLocale;
    const selectedLocale = {
      ...selectedLanguageLocale,
      currency: localization.country.currency.isoCode,
    };
    const availableCurrencies = buildCurrencyOptions(
      localization.availableCountries,
      localization.country,
      selectedLanguageLocale.country,
    );

    return {
      availableLocales,
      availableCurrencies,
      defaultLocale,
      selectedLocale,
      selectedMarketCountry: localization.country.isoCode,
    };
  } catch (error) {
    console.warn("Unable to load Shopify Markets localization", error);
    const availableLocales = isWeaverseDesignMode(request)
      ? [...SUPPORTED_LOCALES]
      : [DEFAULT_LOCALE];
    const selectedLanguageLocale =
      availableLocales.find(
        (locale) =>
          localeCode(locale) ===
          getLocaleSegment(new URL(request.url).pathname),
      ) ?? DEFAULT_LOCALE;
    const selectedMarketLocale =
      SUPPORTED_LOCALES.find(
        (locale) => locale.country === storefront.i18n.country,
      ) ?? selectedLanguageLocale;
    return {
      availableLocales,
      availableCurrencies: buildFallbackCurrencyOptions(availableLocales),
      defaultLocale: DEFAULT_LOCALE,
      selectedMarketCountry: selectedMarketLocale.country,
      selectedLocale: {
        ...selectedLanguageLocale,
        currency: selectedMarketLocale.currency,
      },
    };
  }
}

function buildCurrencyOptions(
  availableCountries: LocalizationQueryData["localization"]["availableCountries"],
  selectedCountry: LocalizationQueryData["localization"]["country"],
  languageCountry: CountryCode,
): CurrencyOption[] {
  const countriesByCode = new Map(
    [...availableCountries, selectedCountry].map((country) => [
      country.isoCode,
      country,
    ]),
  );
  const supportedCountries = Array.from(
    new Set(SUPPORTED_LOCALES.map((locale) => locale.country)),
  ).flatMap((countryCode) => {
    const country = countriesByCode.get(countryCode);
    return country ? [country] : [];
  });
  const currencyGroups = new Map<CurrencyCode, typeof supportedCountries>();

  for (const country of supportedCountries) {
    const currencyCode = country.currency.isoCode;
    const group = currencyGroups.get(currencyCode) ?? [];
    group.push(country);
    currencyGroups.set(currencyCode, group);
  }

  return Array.from(currencyGroups.entries()).map(([currency, countries]) => {
    const country =
      countries.find(
        (candidate) => candidate.isoCode === selectedCountry.isoCode,
      ) ??
      countries.find((candidate) => candidate.isoCode === languageCountry) ??
      countries[0];
    const configuredCountryName = SUPPORTED_LOCALES.find(
      (locale) => locale.country === country.isoCode,
    )?.countryName;
    const currencyName =
      currency === "EUR"
        ? "Euro"
        : countries.length > 1
          ? country.currency.name
          : configuredCountryName || country.name;

    return {
      country: country.isoCode,
      countryName: country.name,
      currency,
      currencyName,
      label: `${currencyName} - ${currency}`,
      symbol: country.currency.symbol,
    };
  });
}

function buildFallbackCurrencyOptions(
  locales: readonly I18nLocale[],
): CurrencyOption[] {
  return Array.from(
    new Map(locales.map((locale) => [locale.currency, locale])).entries(),
  ).map(([currency, locale]) => {
    const currencyName = currency === "EUR" ? "Euro" : locale.countryName;
    const name = currencyName || currency;

    return {
      country: locale.country,
      countryName: locale.countryName || locale.country,
      currency,
      currencyName: name,
      label: `${name} - ${currency}`,
      symbol: currency,
    };
  });
}

function mergeLanguages<T extends { isoCode: LanguageCode }>(
  ...languageGroups: T[][]
) {
  return Array.from(
    new Map(
      languageGroups.flat().map((language) => [language.isoCode, language]),
    ).values(),
  );
}

function isWeaverseDesignMode(request: Request) {
  const url = new URL(request.url);
  return (
    url.searchParams.get("isDesignMode") === "true" ||
    url.searchParams.has("weaverseHost")
  );
}

export function getRequestI18n(
  request: Request,
  marketCountry?: string,
): I18nLocale {
  const segment = getLocaleSegment(new URL(request.url).pathname);
  const languageLocale = segment
    ? (SUPPORTED_LOCALES.find((locale) => localeCode(locale) === segment) ??
      DEFAULT_LOCALE)
    : DEFAULT_LOCALE;
  const marketLocale = marketCountry
    ? SUPPORTED_LOCALES.find((locale) => locale.country === marketCountry)
    : undefined;

  return marketLocale
    ? {
        ...languageLocale,
        country: marketLocale.country,
        countryName: marketLocale.countryName,
        currency: marketLocale.currency,
      }
    : languageLocale;
}

const LOCALIZATION_QUERY = `#graphql
  query StoreLocalization($country: CountryCode!, $language: LanguageCode!)
    @inContext(country: $country, language: $language) {
    localization {
      country {
        isoCode
        name
        currency {
          isoCode
          name
          symbol
        }
      }
      language {
        isoCode
        name
        endonymName
      }
      availableLanguages {
        isoCode
        name
        endonymName
      }
      availableCountries {
        isoCode
        name
        currency {
          isoCode
          name
          symbol
        }
        availableLanguages {
          isoCode
          name
          endonymName
        }
      }
    }
  }
` as const;
