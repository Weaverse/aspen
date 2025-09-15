import { CaretRightIcon } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Slider from "@radix-ui/react-slider";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import type {
  Filter,
  ProductFilter,
} from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { useRef, useState } from "react";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { OPTIONS_AS_SWATCH } from "~/components/product/product-option-values";
import { ScrollArea } from "~/components/scroll-area";
import { useClosestWeaverseItem } from "~/hooks/use-closest-weaverse-item";
import type { RootLoader } from "~/root";
import type { CollectionFiltersData } from "~/sections/collection-filters";
import { cn } from "~/utils/cn";
import {
  type AppliedFilter,
  FILTER_URL_PREFIX,
  filterInputToParams,
  getAppliedFilterLink,
  getFilterLink,
} from "~/utils/filter";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export function FiltersSearchPage({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const parentInstance = useClosestWeaverseItem(ref);
  const parentData = (parentInstance?.data ||
    {}) as unknown as CollectionFiltersData;
  const {
    expandFilters = false,
    showFiltersCount = false,
    enableSwatches = true,
    displayAsButtonFor = "",
  } = parentData as Partial<CollectionFiltersData>;

  const loaderData = useLoaderData<any>();
  const collection: CollectionQuery["collection"] | undefined =
    loaderData?.collection;
  const productsConn = collection?.products || loaderData?.products;

  const appliedFilters: AppliedFilter[] = (loaderData?.appliedFilters ||
    []) as AppliedFilter[];
  const appliedFiltersKeys = appliedFilters
    .map((filter) => filter.label)
    .join("-");

  const filters: Filter[] = (collection?.products?.filters ||
    productsConn?.filters ||
    []) as Filter[];

  return (
    <ScrollArea className="h-[calc(100vh-var(--height-nav)-100px)]">
      <Accordion.Root
        type="multiple"
        className={cn("divide-y divide-line-subtle pr-3", className)}
        key={
          (collection?.id || "search") +
          appliedFiltersKeys +
          String(expandFilters) +
          String(showFiltersCount)
        }
        defaultValue={expandFilters ? filters.map((filter) => filter.id) : []}
      >
        {filters.map((filter: Filter) => {
          const asSwatch =
            enableSwatches && OPTIONS_AS_SWATCH.includes(filter.label);
          const asButton = displayAsButtonFor.includes(filter.label);

          return (
            <Accordion.Item
              key={filter.id}
              ref={ref}
              value={filter.id}
              className="w-full pt-7 pb-6"
            >
              <Accordion.Trigger className="flex w-full items-center justify-between data-[state=open]:[&>svg]:rotate-90">
                <span>{filter.label}</span>
                <CaretRightIcon className="h-4 w-4 rotate-0 transition-transform" />
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
                  className={clsx(
                    "flex pt-8",
                    asSwatch || asButton
                      ? "flex-wrap gap-1.5"
                      : "flex-col gap-5",
                  )}
                >
                  {filter.type === "PRICE_RANGE" ? (
                    collection ? (
                      <PriceRangeFilter
                        collection={collection as CollectionQuery["collection"]}
                      />
                    ) : null
                  ) : (
                    filter.values?.map((option) => (
                      <FilterItem
                        key={option.id}
                        displayAs={
                          asSwatch
                            ? "swatch"
                            : asButton
                              ? "button"
                              : "list-item"
                        }
                        appliedFilters={appliedFilters as AppliedFilter[]}
                        option={option}
                        showFiltersCount={showFiltersCount}
                      />
                    ))
                  )}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </ScrollArea>
  );
}

type FilterDisplayAs = "swatch" | "button" | "list-item";

function FilterItem({
  displayAs,
  option,
  appliedFilters,
  showFiltersCount,
}: {
  displayAs: FilterDisplayAs;
  option: Filter["values"][0];
  appliedFilters: AppliedFilter[];
  showFiltersCount: boolean;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const { swatchesConfigs } = useRouteLoaderData<RootLoader>("root");

  const filter = appliedFilters.find(
    (flt) => JSON.stringify(flt.filter) === option.input,
  );

  const [checked, setChecked] = useState(!!filter);

  function handleCheckedChange(newChecked: boolean) {
    setChecked(newChecked);

    // Handle filters for both search and collection pages
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
        <TooltipTrigger>
          <button
            type="button"
            className={cn(
              "h-10 w-10 disabled:cursor-not-allowed",
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
        <TooltipContent>{option.label}</TooltipContent>
      </Tooltip>
    );
  }

  if (displayAs === "button") {
    return (
      <button
        type="button"
        className={cn(
          "border border-line-subtle px-5 py-2 disabled:cursor-not-allowed",
          checked && "border-line bg-gray-50",
          option.count === 0 && "diagonal",
        )}
        onClick={() => handleCheckedChange(!checked)}
        disabled={option.count === 0}
      >
        <Label option={option} showFiltersCount={showFiltersCount} />
      </button>
    );
  }

  return (
    <label className="flex w-full cursor-pointer items-center gap-2">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={(value) => handleCheckedChange(Boolean(value))}
        className="grid h-6 w-6 place-items-center border border-line-subtle"
      >
        <Checkbox.Indicator className="h-4 w-4 bg-gray-800" />
      </Checkbox.Root>
      <Label option={option} showFiltersCount={showFiltersCount} />
    </label>
  );
}

function Label({
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

export function PriceRangeFilter({
  collection,
}: {
  collection: CollectionQuery["collection"];
}) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const thumbRef = useRef<"from" | "to" | null>(null);

  const { minVariantPrice, maxVariantPrice } = getPricesRange(collection);
  const { min, max } = getPricesFromFilter(params);

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  function handleFilter() {
    let paramsClone = new URLSearchParams(params);
    if (minPrice === undefined && maxPrice === undefined) {
      paramsClone.delete(`${FILTER_URL_PREFIX}price`);
    } else {
      const price = {
        ...(minPrice === undefined ? {} : { min: minPrice }),
        ...(maxPrice === undefined ? {} : { max: maxPrice }),
      };
      paramsClone = filterInputToParams({ price }, paramsClone);
    }
    if (params.toString() !== paramsClone.toString()) {
      navigate(`${location.pathname}?${paramsClone.toString()}`, {
        preventScrollReset: true,
      });
    }
  }

  return (
    <div className="space-y-4">
      <Slider.Root
        min={minVariantPrice}
        max={maxVariantPrice}
        step={1}
        minStepsBetweenThumbs={1}
        value={[minPrice || minVariantPrice, maxPrice || maxVariantPrice]}
        onValueChange={([newMin, newMax]) => {
          if (thumbRef.current) {
            if (thumbRef.current === "from") {
              if (maxPrice === undefined || newMin < maxPrice) {
                setMinPrice(newMin);
              }
            } else if (minPrice === undefined || newMax > minPrice) {
              setMaxPrice(newMax);
            }
          } else {
            setMinPrice(newMin);
            setMaxPrice(newMax);
          }
        }}
        onValueCommit={handleFilter}
        className="relative flex h-4 w-full items-center"
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-gray-200">
          <Slider.Range className="absolute h-full rounded-full bg-gray-800" />
        </Slider.Track>
        {["from", "to"].map((s: "from" | "to") => (
          <Slider.Thumb
            key={s}
            onPointerUp={() => {
              thumbRef.current = null;
            }}
            onPointerDown={() => {
              thumbRef.current = s;
            }}
            className={clsx(
              "block h-4 w-4 cursor-grab rounded-full bg-gray-800 shadow-md",
              "focus-visible:outline-hidden",
            )}
          />
        ))}
      </Slider.Root>
      <div className="flex items-center gap-4">
        <div className="flex shrink items-center gap-1 border border-line-subtle bg-gray-50 px-4">
          <VisuallyHidden.Root asChild>
            <label htmlFor="minPrice" aria-label="Min price">
              Min price
            </label>
          </VisuallyHidden.Root>
          <span>$</span>
          <input
            name="minPrice"
            type="number"
            value={minPrice ?? ""}
            min={minVariantPrice}
            placeholder={minVariantPrice.toString()}
            onChange={(e) => {
              const { value } = e.target;
              const newMinPrice = Number.isNaN(Number.parseFloat(value))
                ? undefined
                : Number.parseFloat(value);
              setMinPrice(newMinPrice);
            }}
            onBlur={handleFilter}
            className="w-full bg-transparent py-3 text-right focus-visible:outline-hidden"
          />
        </div>
        <span>To</span>
        <div className="flex items-center gap-1 border border-line-subtle bg-gray-50 px-4">
          <VisuallyHidden.Root asChild>
            <label htmlFor="maxPrice" aria-label="Max price">
              Max price
            </label>
          </VisuallyHidden.Root>
          <span>$</span>
          <input
            name="maxPrice"
            type="number"
            value={maxPrice ?? ""}
            max={maxVariantPrice}
            placeholder={maxVariantPrice.toString()}
            onChange={(e) => {
              const { value } = e.target;
              const newMaxPrice = Number.isNaN(Number.parseFloat(value))
                ? undefined
                : Number.parseFloat(value);
              setMaxPrice(newMaxPrice);
            }}
            onBlur={handleFilter}
            className="w-full bg-transparent py-3 text-right focus-visible:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}

function getPricesRange(collection: CollectionQuery["collection"]) {
  const { highestPriceProduct, lowestPriceProduct } = collection;
  const minVariantPrice =
    lowestPriceProduct.nodes[0]?.priceRange?.minVariantPrice;
  const maxVariantPrice =
    highestPriceProduct.nodes[0]?.priceRange?.maxVariantPrice;
  return {
    minVariantPrice: Number(minVariantPrice?.amount) || 0,
    maxVariantPrice: Number(maxVariantPrice?.amount) || 1000,
  };
}

function getPricesFromFilter(params: URLSearchParams) {
  const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
  const price = priceFilter
    ? (JSON.parse(priceFilter) as ProductFilter["price"])
    : undefined;
  const min = Number.isNaN(Number(price?.min)) ? undefined : Number(price?.min);
  const max = Number.isNaN(Number(price?.max)) ? undefined : Number(price?.max);
  return { min, max };
}
