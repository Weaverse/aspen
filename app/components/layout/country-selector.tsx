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
}: {
  inputClassName?: string;
  wrapperClassName?: string;
  enableFlag?: boolean;
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
    if (!inView || fetcher.data || fetcher.state === "loading") return;
    fetcher.load("/api/countries");
  }, [inView, fetcher]);

  let handleLocaleChange = ({
    redirectTo,
    buyerIdentity,
  }: {
    redirectTo: string;
    buyerIdentity: CartBuyerIdentityInput;
  }) => {
    let cartFormInput = {
      action: CartForm.ACTIONS.BuyerIdentityUpdate,
      inputs: { buyerIdentity },
    };
    let formData = {
      redirectTo,
      cartFormInput: JSON.stringify(cartFormInput),
    };
    submit(formData, {
      method: "POST",
      action: "/cart",
    });
  };

  return (
    <div ref={observerRef} className={cn("grid gap-4 w-48", wrapperClassName)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "w-full border border-[#A79D95] overflow-clip cursor-pointer text-left outline-hidden flex items-center gap-2",
              inputClassName,
            )}
            aria-label="Select country"
          >
            {enableFlag && (
              <ReactCountryFlag
                svg
                countryCode={selectedLocale.country}
                style={{ width: "24px", height: "14px" }}
              />
            )}
            <span>{selectedLocale.label}</span>
            <CaretDownIcon className="ml-auto w-4 h-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-10">
            <div className="w-48 max-h-40 overflow-auto py-2 bg-[#3b352c] my-2">
              {countries &&
                Object.keys(countries).map((countryPath) => {
                  const countryLocale = countries[countryPath];
                  const isSelected =
                    countryLocale.language === selectedLocale.language &&
                    countryLocale.country === selectedLocale.country;
                  return (
                    <Popover.Close
                      aria-label={`Select ${countryLocale.label} country`}
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
                      className="text-white bg-[#3b352c] hover:bg-[#4a423a] w-full p-2 transition flex gap-2 items-center text-left cursor-pointer py-2 px-4 text-sm"
                    >
                      {enableFlag && (
                        <ReactCountryFlag
                          svg
                          countryCode={countryLocale.country}
                          style={{ width: "24px", height: "14px" }}
                        />
                      )}
                      <span>{countryLocale.label}</span>
                      {isSelected ? (
                        <span className="ml-auto">
                          <CheckCircleIcon className="w-5 h-5" />
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
