import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "@weaverse/hydrogen";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Link } from "react-router";
import { cn } from "~/utils/cn";
import { useLocalizationSelector } from "./country-selector/use-localization-selector";

export const localeSelectorGroupClassName =
  "flex min-w-0 max-w-full items-center gap-1.5";
export const currencySelectorWrapperClassName = "w-auto min-w-0 max-w-[260px]";
export const languageSelectorWrapperClassName = "w-auto min-w-0 max-w-[180px]";

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
  const [open, setOpen] = useState(false);
  const {
    isChangingCurrency,
    selectedLabel,
    selectedMarketCountry,
    selectorOptions,
    selectCurrency,
  } = useLocalizationSelector(mode);

  return (
    <div className={cn("grid min-w-0 w-48 gap-4", wrapperClassName)}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-w-0 w-full cursor-pointer items-center gap-2 border border-[#A79D95] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
              inputClassName,
            )}
            aria-label={
              mode === "language"
                ? t("locale.selectLanguage")
                : t("locale.selectCurrency")
            }
          >
            {enableFlag && mode === "country" && (
              <ReactCountryFlag
                svg
                countryCode={selectedMarketCountry}
                className="shrink-0"
                style={{ width: "24px", height: "14px" }}
              />
            )}
            <span className="min-w-0 flex-1 whitespace-normal break-words leading-5">
              {selectedLabel}
            </span>
            <CaretDownIcon className="ml-auto h-4 w-4 shrink-0" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 w-max min-w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-white/15 bg-[#3b352c] shadow-lg"
          >
            <div className="max-h-[min(320px,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain py-1">
              {selectorOptions.map((option) => {
                if (option.type === "language") {
                  return (
                    <Link
                      aria-label={t("locale.selectOption", {
                        option: option.label,
                      })}
                      className="flex w-full cursor-pointer items-center gap-2 bg-[#3b352c] px-4 py-2.5 text-left text-sm text-white transition hover:bg-[#4a423a] focus-visible:bg-[#4a423a] focus-visible:outline-hidden"
                      key={option.key}
                      onClick={() => setOpen(false)}
                      prefetch="intent"
                      preventScrollReset
                      to={option.redirectTo || "/"}
                    >
                      <span className="min-w-0 flex-1 whitespace-normal break-words leading-5">
                        {option.label}
                      </span>
                      {option.isSelected ? (
                        <span className="ml-auto shrink-0">
                          <CheckCircleIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </Link>
                  );
                }

                return (
                  <button
                    aria-label={t("locale.selectOption", {
                      option: option.label,
                    })}
                    type="button"
                    disabled={isChangingCurrency || option.isSelected}
                    className="flex w-full cursor-pointer items-center gap-2 bg-[#3b352c] px-4 py-2.5 text-left text-sm text-white transition hover:bg-[#4a423a] focus-visible:bg-[#4a423a] focus-visible:outline-hidden"
                    key={option.key}
                    onClick={() => {
                      setOpen(false);
                      selectCurrency(option);
                    }}
                  >
                    {enableFlag && mode === "country" && (
                      <ReactCountryFlag
                        svg
                        countryCode={option.country}
                        className="shrink-0"
                        style={{ width: "24px", height: "14px" }}
                      />
                    )}
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-5">
                      {option.label}
                    </span>
                    {option.isSelected ? (
                      <span className="ml-auto shrink-0">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
