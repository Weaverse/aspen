import { CartForm } from "@shopify/hydrogen";
import { useFetcher, useLocation, useRouteLoaderData } from "react-router";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { RootLoader } from "~/root";
import type { CurrencyOption, I18nLocale } from "~/types/locale";
import { DEFAULT_LOCALE } from "~/utils/const";
import { switchLocalePath } from "~/utils/locale";

export type LocalizationSelectorOption = {
  country: string;
  isSelected: boolean;
  key: string;
  label: string;
  type: "currency" | "language";
  redirectTo?: string;
};

/**
 * Keep localization state and mutations outside of the selector UI, following
 * Pilot's country-selector hook pattern. Language remains URL-driven while
 * currency remains Shopify Markets/session-driven for Aspen's independent
 * selectors.
 */
export function useLocalizationSelector(mode: "country" | "language") {
  const currencyFetcher = useFetcher();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const availableLocales = rootData?.availableLocales ?? [DEFAULT_LOCALE];
  const availableCurrencies =
    rootData?.availableCurrencies ??
    getFallbackCurrencyOptions(availableLocales);
  const selectedMarketCountry =
    rootData?.selectedMarketCountry ?? selectedLocale.country;
  const { pathname, search, hash } = useLocation();
  const cartAction = usePrefixPathWithLocale("/cart");
  const pendingMarketCountry =
    currencyFetcher.state !== "idle"
      ? currencyFetcher.formData?.get("marketCountry")
      : null;

  const languageOptions = Array.from(
    new Set(availableLocales.map((locale) => locale.language)),
  ).flatMap((language) => {
    const matchingLocale = availableLocales.find(
      (candidate) => candidate.language === language,
    );
    return matchingLocale ? [matchingLocale] : [];
  });

  const selectorOptions: LocalizationSelectorOption[] =
    mode === "language"
      ? languageOptions.map((locale) => ({
          country: selectedMarketCountry,
          isSelected: locale.language === selectedLocale.language,
          key: `language-${locale.language}`,
          label: locale.languageName || locale.language,
          type: "language",
          redirectTo: switchLocalePath({
            pathname,
            search,
            hash,
            locale,
          }),
        }))
      : availableCurrencies.map((option) => ({
          country: option.country,
          isSelected:
            typeof pendingMarketCountry === "string"
              ? option.country === pendingMarketCountry
              : option.currency === selectedLocale.currency,
          key: `currency-${option.currency}`,
          label: option.label,
          type: "currency",
        }));

  const selectedCurrency = availableCurrencies.find((option) =>
    typeof pendingMarketCountry === "string"
      ? option.country === pendingMarketCountry
      : option.currency === selectedLocale.currency,
  );
  const selectedLabel =
    mode === "language"
      ? selectedLocale.languageName || selectedLocale.language
      : selectedCurrency?.label ||
        `${selectedLocale.countryName || selectedLocale.country} - ${selectedLocale.currency}`;

  function selectCurrency(option: LocalizationSelectorOption) {
    if (option.type !== "currency" || option.isSelected) {
      return;
    }

    currencyFetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.BuyerIdentityUpdate,
          inputs: {
            buyerIdentity: { countryCode: option.country },
          },
        }),
        localizationChange: "currency",
        marketCountry: option.country,
      },
      { action: cartAction, method: "post" },
    );
  }

  return {
    isChangingCurrency: currencyFetcher.state !== "idle",
    selectedLabel,
    selectedMarketCountry,
    selectorOptions,
    selectCurrency,
  };
}

function getFallbackCurrencyOptions(
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
