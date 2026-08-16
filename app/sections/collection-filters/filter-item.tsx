import { CheckIcon } from "@phosphor-icons/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import type { Filter } from "@shopify/hydrogen/storefront-api-types";
import { useId } from "react";
import {
  useLocation,
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import type { AppliedFilter } from "~/utils/filter";
import { getAppliedFilterLink, getFilterLink } from "~/utils/filter";

type FilterDisplayAs = "swatch" | "button" | "list-item";
type FilterContext = "sidebar" | "drawer";

export function FilterItem({
  displayAs,
  option,
  appliedFilters,
  showFiltersCount,
  context = "sidebar",
}: {
  displayAs: FilterDisplayAs;
  option: Filter["values"][0];
  appliedFilters: AppliedFilter[];
  showFiltersCount: boolean;
  context?: FilterContext;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const { swatchesConfigs } = useRouteLoaderData<RootLoader>("root");
  const checkboxId = useId();

  const filter = appliedFilters.find(
    (flt) => JSON.stringify(flt.filter) === option.input,
  );

  const checked = Boolean(filter);

  function handleCheckedChange(newChecked: boolean) {
    if (newChecked) {
      const link = getFilterLink(option.input as string, params, location);
      navigate(link, { preventScrollReset: true });
    } else if (filter) {
      const link = getAppliedFilterLink(filter, params, location);
      navigate(link, { preventScrollReset: true });
    }
  }

  if (displayAs === "swatch") {
    const { colors, images } = swatchesConfigs;
    const swatchImage = images.find(({ name }) => name === option.label);
    const swatchColor = colors.find(({ name }) => name === option.label);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-pressed={checked}
            aria-label={option.label}
            className={cn(
              "h-10 w-10 rounded-sm disabled:cursor-not-allowed",
              "border hover:border-body",
              checked ? "border-line p-1" : "border-line-subtle",
              option.count === 0 && "diagonal",
            )}
            onClick={() => handleCheckedChange(!checked)}
            disabled={option.count === 0}
          >
            <span
              className="inline-block h-full w-full"
              style={{
                backgroundImage: swatchImage?.value
                  ? `url(${swatchImage?.value})`
                  : undefined,
                backgroundSize: "cover",
                backgroundColor:
                  swatchColor?.value || option.label.toLowerCase(),
              }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <FilterLabel option={option} showFiltersCount={showFiltersCount} />
        </TooltipContent>
      </Tooltip>
    );
  }

  if (displayAs === "button") {
    return (
      <button
        type="button"
        aria-pressed={checked}
        className={cn(
          "min-h-10 rounded-lg border px-3 py-2 text-center disabled:cursor-not-allowed",
          context === "drawer" && "h-10 min-h-10 px-3 text-sm",
          option.count === 0 && "diagonal text-body-subtle",
          checked
            ? "border-line bg-body text-background"
            : "border-line-subtle hover:border-line",
        )}
        onClick={() => handleCheckedChange(!checked)}
        disabled={option.count === 0}
      >
        <FilterLabel option={option} showFiltersCount={showFiltersCount} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex w-fit items-center gap-4",
        context === "sidebar" && "gap-2.5",
        option.count === 0 && "text-body-subtle",
      )}
    >
      <Checkbox.Root
        id={checkboxId}
        checked={checked}
        onCheckedChange={(value) => handleCheckedChange(Boolean(value))}
        disabled={option.count === 0}
        className={cn(
          "h-5 w-5 shrink-0 rounded-[7px]",
          "border border-line focus-visible:outline-hidden",
          "disabled:cursor-not-allowed disabled:opacity-50",
          context === "sidebar" && "data-[state=checked]:border-body",
        )}
      >
        <Checkbox.Indicator className="flex items-center justify-center text-current">
          <CheckIcon className="h-3.5 w-3.5" weight="bold" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label
        htmlFor={checkboxId}
        className={cn(
          "cursor-pointer",
          option.count === 0 && "cursor-not-allowed",
        )}
      >
        <FilterLabel option={option} showFiltersCount={showFiltersCount} />
      </label>
    </div>
  );
}
function FilterLabel({
  option,
  showFiltersCount,
}: {
  option: Filter["values"][0];
  showFiltersCount: boolean;
}) {
  if (showFiltersCount) {
    return (
      <span>
        {option.label} <span>({option.count})</span>
      </span>
    );
  }
  return option.label;
}
