import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { CartForm } from "@shopify/hydrogen";
import type { CartBuyerIdentityInput } from "@shopify/hydrogen/storefront-api-types";
import { useEffect, useRef } from "react";
import ReactCountryFlag from "react-country-flag";
import { useInView } from "react-intersection-observer";
import {
  useFetcher,
  useLocation,
  useRouteLoaderData,
  useSubmit,
} from "react-router";
import type { RootLoader } from "~/root";
import type { I18nLocale, Localizations } from "~/types/locale";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";

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
  const fetcher = useFetcher();
  const submit = useSubmit();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const { pathname, search } = useLocation();
  const pathWithoutLocale = `${pathname.replace(
    selectedLocale.pathPrefix,
    "",
  )}${search}`;

  const countries = (fetcher.data ?? {}) as Localizations;
  const defaultLocale = countries?.default;
  const defaultLocalePrefix = defaultLocale
    ? `${defaultLocale?.language}-${defaultLocale?.country}`
    : "";
  const countryEntries = Object.entries(countries);
  const localeOptions =
    mode === "language"
      ? Array.from(
          new Map(
            countryEntries.map(([countryPath, locale]) => [
              locale.language,
              [countryPath, locale] as const,
            ]),
          ).values(),
        )
      : countryEntries;
  const selectedLabel =
    mode === "language"
      ? getLanguageLabel(selectedLocale.language)
      : selectedLocale.label;

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  const observerRef = useRef(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    ref(observerRef.current);
  }, [ref, observerRef]);

  // Get available countries list when in view
  useEffect(() => {
    if (!inView || fetcher.data || fetcher.state === "loading") {
      return;
    }
    fetcher.load("/api/countries");
  }, [inView, fetcher]);

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
      action: "/cart",
    });
  };

  return (
    <div ref={observerRef} className={cn("grid w-48 gap-4", wrapperClassName)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 overflow-clip border border-[#A79D95] text-left outline-hidden",
              inputClassName,
            )}
            aria-label={
              mode === "language" ? "Select language" : "Select country"
            }
          >
            {enableFlag && mode === "country" && (
              <ReactCountryFlag
                svg
                countryCode={selectedLocale.country}
                style={{ width: "24px", height: "14px" }}
              />
            )}
            <span className="truncate">{selectedLabel}</span>
            <CaretDownIcon className="ml-auto h-4 w-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-10">
            <div className="my-2 max-h-40 w-48 overflow-auto bg-[#3b352c] py-2">
              {localeOptions.map(([countryPath, optionLocale]) => {
                const countryLocale =
                  mode === "language"
                    ? (countryEntries.find(
                        ([, locale]) =>
                          locale.language === optionLocale.language &&
                          locale.country === selectedLocale.country,
                      )?.[1] ?? optionLocale)
                    : optionLocale;
                const isSelected =
                  mode === "language"
                    ? countryLocale.language === selectedLocale.language
                    : countryLocale.language === selectedLocale.language &&
                      countryLocale.country === selectedLocale.country;
                const optionLabel =
                  mode === "language"
                    ? getLanguageLabel(countryLocale.language)
                    : countryLocale.label;
                return (
                  <Popover.Close
                    aria-label={`Select ${optionLabel}`}
                    key={countryPath}
                    type="button"
                    onClick={() =>
                      handleLocaleChange({
                        redirectTo: getCountryUrlPath({
                          countryLocale,
                          defaultLocalePrefix,
                          pathWithoutLocale,
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

const LANGUAGE_LABELS: Record<string, string> = {
  DE: "Deutsch",
  EN: "English",
  ES: "Español",
  FR: "Français",
  IT: "Italiano",
  JA: "日本語",
  KO: "한국어",
  NL: "Nederlands",
  PT: "Português",
  ZH: "中文",
};

function getLanguageLabel(language: string) {
  return LANGUAGE_LABELS[language.toUpperCase()] ?? language.toUpperCase();
}

function getCountryUrlPath({
  countryLocale,
  defaultLocalePrefix,
  pathWithoutLocale,
}: {
  countryLocale: I18nLocale;
  pathWithoutLocale: string;
  defaultLocalePrefix: string;
}) {
  let countryPrefixPath = "";
  const countryLocalePrefix = `${countryLocale.language}-${countryLocale.country}`;
  if (countryLocalePrefix !== defaultLocalePrefix) {
    countryPrefixPath = `/${countryLocalePrefix.toLowerCase()}`;
  }
  return `${countryPrefixPath}${pathWithoutLocale}`;
}
