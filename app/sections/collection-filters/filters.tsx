import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import type { Filter } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { OPTIONS_AS_SWATCH } from "~/components/product/product-option-values";
import { ScrollArea } from "~/components/scroll-area";
import { useClosestWeaverseItem } from "~/hooks/use-closest-weaverse-item";
import { cn } from "~/utils/cn";
import type { AppliedFilter } from "~/utils/filter";
import type { CollectionFiltersData } from ".";
import { FilterItem } from "./filter-item";
import { PriceRangeFilter } from "./price-range-filter";

type FiltersProps = {
  className?: string;
  context?: "sidebar" | "drawer";
};

type FilterDisplayAs = "swatch" | "button" | "list-item";

export function Filters({ className, context = "sidebar" }: FiltersProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const parentInstance = useClosestWeaverseItem(ref);
  const parentData = (parentInstance?.data ||
    {}) as unknown as Partial<CollectionFiltersData>;
  const {
    expandFilters = false,
    expandedFiltersByDefault = "Price, Size, Color",
    showFiltersCount = false,
    enableSwatches = false,
    displayAsButtonFor = "Size, More filters",
  } = parentData;
  const { collection, appliedFilters = [] } = useLoaderData<
    CollectionQuery & {
      collections: Array<{ handle: string; title: string }>;
      appliedFilters: AppliedFilter[];
    }
  >();
  const filters = (collection.products.filters || []) as Filter[];
  const appliedFiltersKeys = appliedFilters
    .map((filter) => JSON.stringify(filter.filter))
    .join("-");
  const buttonFilterLabels = new Set(
    displayAsButtonFor
      .split(",")
      .map((label) => label.trim().toLowerCase())
      .filter(Boolean),
  );
  const defaultOpenFilterLabels = new Set(
    expandedFiltersByDefault
      .split(",")
      .map((label) => label.trim().toLowerCase())
      .filter(Boolean),
  );
  const filtersWithSelections = filters
    .filter((filter) =>
      filter.values.some((option) =>
        appliedFilters.some(
          (appliedFilter) =>
            JSON.stringify(appliedFilter.filter) === option.input,
        ),
      ),
    )
    .map((filter) => filter.id);
  const configuredExpandedFilters = filters
    .filter((filter) =>
      defaultOpenFilterLabels.has(filter.label.trim().toLowerCase()),
    )
    .map((filter) => filter.id);
  const defaultExpandedFilters = expandFilters
    ? filters.map((filter) => filter.id)
    : Array.from(
        new Set([...configuredExpandedFilters, ...filtersWithSelections]),
      );

  const accordion = filters.length ? (
    <Accordion.Root
      type="multiple"
      className={cn(
        "divide-y divide-line-subtle",
        context === "sidebar" ? "pr-3" : "border-line-subtle border-b",
        className,
      )}
      key={
        collection.id +
        appliedFiltersKeys +
        expandFilters +
        showFiltersCount +
        context
      }
      defaultValue={defaultExpandedFilters}
    >
      {filters.map((filter: Filter) => {
        const filterLabel = filter.label.trim().toLowerCase();
        const asSwatch =
          enableSwatches && OPTIONS_AS_SWATCH.includes(filter.label);
        const asButton = buttonFilterLabels.has(filterLabel);
        const displayAs: FilterDisplayAs = asSwatch
          ? "swatch"
          : asButton
            ? "button"
            : "list-item";

        return (
          <Accordion.Item
            key={filter.id}
            value={filter.id}
            className={cn(
              "w-full",
              context === "sidebar" ? "pt-7 pb-6" : "py-0",
            )}
          >
            <Accordion.Trigger
              className={cn(
                "group flex w-full items-center justify-between text-left uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
                "data-[state=open]:[&_.filter-plus]:hidden data-[state=closed]:[&_.filter-minus]:hidden",
                context === "drawer" && "min-h-[69px] pt-[5px] text-sm",
              )}
            >
              <span>
                {getFilterDisplayLabel(
                  filter.label,
                  context,
                  t("collection.stock"),
                )}
              </span>
              <span
                aria-hidden="true"
                className="relative block h-[18px] w-[18px] shrink-0"
              >
                <PlusIcon className="filter-plus absolute top-1/2 right-0.5 h-3 w-3 -translate-y-1/2" />
                <MinusIcon className="filter-minus absolute top-1/2 right-0.5 h-3 w-3 -translate-y-1/2" />
              </span>
            </Accordion.Trigger>
            <Accordion.Content
              style={
                {
                  "--expand-to": "var(--radix-accordion-content-height)",
                  "--expand-duration": "0.15s",
                  "--collapse-from": "var(--radix-accordion-content-height)",
                  "--collapse-duration": "0.15s",
                } as React.CSSProperties
              }
              className={clsx([
                "overflow-hidden",
                "data-[state=closed]:animate-collapse",
                "data-[state=open]:animate-expand",
              ])}
            >
              <div
                className={cn(
                  "flex",
                  context === "sidebar"
                    ? "pt-8"
                    : filter.type === "PRICE_RANGE"
                      ? "pt-1 pb-6"
                      : "pt-2 pb-6",
                  asSwatch || asButton
                    ? "flex-wrap gap-3"
                    : cn(
                        "flex-col gap-5",
                        context === "drawer" && "gap-[21px]",
                      ),
                )}
              >
                {filter.type === "PRICE_RANGE" ? (
                  <PriceRangeFilter
                    collection={collection as CollectionQuery["collection"]}
                    context={context}
                  />
                ) : (
                  <FilterValues
                    filter={filter}
                    displayAs={displayAs}
                    appliedFilters={appliedFilters}
                    showFiltersCount={showFiltersCount}
                    context={context}
                  />
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  ) : (
    <p className={cn("py-8 text-body-subtle", className)}>
      {t("collection.noFiltersAvailable")}
    </p>
  );

  return (
    <div ref={ref}>
      {context === "drawer" ? (
        accordion
      ) : (
        <ScrollArea className="h-[calc(100vh-var(--height-nav)-100px)]">
          {accordion}
        </ScrollArea>
      )}
    </div>
  );
}

function getFilterDisplayLabel(
  label: string,
  context: "sidebar" | "drawer",
  stockLabel: string,
) {
  if (context === "drawer" && label.trim().toLowerCase() === "availability") {
    return stockLabel;
  }
  return label;
}

function FilterValues({
  filter,
  displayAs,
  appliedFilters,
  showFiltersCount,
  context,
}: {
  filter: Filter;
  displayAs: FilterDisplayAs;
  appliedFilters: AppliedFilter[];
  showFiltersCount: boolean;
  context: "sidebar" | "drawer";
}) {
  const { t } = useTranslation();
  const visibleLimit =
    context === "drawer" && displayAs === "list-item" ? 5 : 8;
  const hasSelectedHiddenValue = filter.values
    .slice(visibleLimit)
    .some((option) =>
      appliedFilters.some(
        (appliedFilter) =>
          JSON.stringify(appliedFilter.filter) === option.input,
      ),
    );
  const [showAll, setShowAll] = useState(hasSelectedHiddenValue);
  const visibleOptions = showAll
    ? filter.values
    : filter.values.slice(0, visibleLimit);
  const hiddenCount = filter.values.length - visibleLimit;

  return (
    <>
      {visibleOptions.map((option) => (
        <FilterItem
          key={option.id}
          displayAs={displayAs}
          appliedFilters={appliedFilters}
          option={option}
          showFiltersCount={showFiltersCount}
          context={context}
        />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="w-fit underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll
            ? t("collection.showLess")
            : t("collection.showMore", { count: hiddenCount })}
        </button>
      )}
    </>
  );
}
