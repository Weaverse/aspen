import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { CartForm } from "@shopify/hydrogen";
import type { CartBuyerIdentityInput } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import ReactCountryFlag from "react-country-flag";
import { useLocation, useRouteLoaderData, useSubmit } from "react-router";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { RootLoader } from "~/root";
import type { I18nLocale } from "~/types/locale";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";
import { switchLocalePath } from "~/utils/locale";

export function CountrySelector({
  inputClassName,
  wrapperClassName,
  enableFlag = true,
  mode = "country",
}: {
  inputClassName?: string;
  wrapperClassName?: string;
  enableFlag?: boolean;
  mode?: "country" | "language";
}) {
  const { t } = useTranslation();
  const submit = useSubmit();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const availableLocales = rootData?.availableLocales ?? [DEFAULT_LOCALE];
  const { pathname, search, hash } = useLocation();
  const cartAction = usePrefixPathWithLocale("/cart");
  const localeOptions =
    mode === "language"
      ? Array.from(
          new Set(availableLocales.map((locale) => locale.language)),
        ).flatMap((language) => {
          const matchingLocale =
            availableLocales.find(
              (candidate) =>
                candidate.language === language &&
                candidate.country === selectedLocale.country,
            ) ??
            availableLocales.find(
              (candidate) => candidate.language === language,
            );
          return matchingLocale ? [matchingLocale] : [];
        })
      : Array.from(
          new Set(availableLocales.map((locale) => locale.country)),
        ).flatMap((country) => {
          const matchingLocale =
            availableLocales.find(
              (candidate) =>
                candidate.country === country &&
                candidate.language === selectedLocale.language,
            ) ??
            availableLocales.find((candidate) => candidate.country === country);
          return matchingLocale ? [matchingLocale] : [];
        });
  const selectedLabel =
    mode === "language"
      ? selectedLocale.languageName || selectedLocale.language
      : getCountryLabel(selectedLocale);

  const handleLocaleChange = ({
    redirectTo,
    buyerIdentity,
  }: {
    redirectTo: string;
    buyerIdentity: CartBuyerIdentityInput;
  }) => {
    const cartFormInput = {
      action: CartForm.ACTIONS.BuyerIdentityUpdate,
      inputs: { buyerIdentity },
    };
    const formData = {
      redirectTo,
      cartFormInput: JSON.stringify(cartFormInput),
    };
    submit(formData, {
      method: "POST",
      action: cartAction,
    });
  };

  return (
    <div className={cn("grid min-w-0 w-48 gap-4", wrapperClassName)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-w-0 w-full cursor-pointer items-center gap-2 overflow-hidden border border-[#A79D95] text-left outline-hidden",
              inputClassName,
            )}
            aria-label={
              mode === "language"
                ? t("locale.selectLanguage")
                : t("locale.selectCountry")
            }
          >
            {enableFlag && mode === "country" && (
              <ReactCountryFlag
                svg
                countryCode={selectedLocale.country}
                className="shrink-0"
                style={{ width: "24px", height: "14px" }}
              />
            )}
            <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
            <CaretDownIcon className="ml-auto h-4 w-4 shrink-0" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-10">
            <div className="my-2 max-h-40 w-48 overflow-auto bg-[#3b352c] py-2">
              {localeOptions.map((optionLocale) => {
                const countryLocale = optionLocale;
                const isSelected =
                  mode === "language"
                    ? countryLocale.language === selectedLocale.language
                    : countryLocale.language === selectedLocale.language &&
                      countryLocale.country === selectedLocale.country;
                const optionLabel =
                  mode === "language"
                    ? countryLocale.languageName || countryLocale.language
                    : getCountryLabel(countryLocale);
                return (
                  <Popover.Close
                    aria-label={t("locale.selectOption", {
                      option: optionLabel,
                    })}
                    key={`${countryLocale.language}-${countryLocale.country}`}
                    type="button"
                    onClick={() =>
                      handleLocaleChange({
                        redirectTo: getCountryUrlPath({
                          countryLocale,
                          pathname,
                          search,
                          hash,
                        }),
                        buyerIdentity: {
                          countryCode: countryLocale.country,
                        },
                      })
                    }
                    className="flex w-full cursor-pointer items-center gap-2 bg-[#3b352c] p-2 px-4 py-2 text-left text-sm text-white transition hover:bg-[#4a423a]"
                  >
                    {enableFlag && mode === "country" && (
                      <ReactCountryFlag
                        svg
                        countryCode={countryLocale.country}
                        className="shrink-0"
                        style={{ width: "24px", height: "14px" }}
                      />
                    )}
                    <span>{optionLabel}</span>
                    {isSelected ? (
                      <span className="ml-auto">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                    ) : null}
                  </Popover.Close>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function getCountryLabel(locale: I18nLocale) {
  return `${locale.countryName || locale.country} · ${locale.currency}`;
}

function getCountryUrlPath({
  countryLocale,
  pathname,
  search,
  hash,
}: {
  countryLocale: I18nLocale;
  pathname: string;
  search: string;
  hash: string;
}) {
  return switchLocalePath({ pathname, search, hash, locale: countryLocale });
}
