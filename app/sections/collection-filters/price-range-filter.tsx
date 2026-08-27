import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { useLocale } from "~/hooks/use-locale";
import { cn } from "~/utils/cn";
import { FILTER_URL_PREFIX, filterInputToParams } from "~/utils/filter";
import { formatNumber, intlLocale } from "~/utils/locale";

type PriceRangeFilterProps = {
  collection: CollectionQuery["collection"];
  context?: "sidebar" | "drawer";
};

export function PriceRangeFilter({
  collection,
  context = "sidebar",
}: PriceRangeFilterProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { minVariantPrice, maxVariantPrice, currencyCode } =
    getPricesRange(collection);
  const priceFromUrl = getPricesFromFilter(params);
  const [minPrice, setMinPrice] = useState(priceFromUrl.min);
  const [maxPrice, setMaxPrice] = useState(priceFromUrl.max);
  const currencySymbol = getCurrencySymbol(currencyCode, intlLocale(locale));

  useEffect(() => {
    setMinPrice(priceFromUrl.min);
    setMaxPrice(priceFromUrl.max);
  }, [priceFromUrl.max, priceFromUrl.min]);

  function handleFilter(
    nextMin: number | undefined = minPrice,
    nextMax: number | undefined = maxPrice,
  ) {
    const clampedMin = clampPrice(nextMin, minVariantPrice, maxVariantPrice);
    const clampedMax = clampPrice(nextMax, minVariantPrice, maxVariantPrice);
    const normalizedMin =
      clampedMin !== undefined &&
      clampedMax !== undefined &&
      clampedMin > clampedMax
        ? clampedMax
        : clampedMin;
    const normalizedMax =
      clampedMin !== undefined &&
      clampedMax !== undefined &&
      clampedMin > clampedMax
        ? clampedMin
        : clampedMax;

    setMinPrice(normalizedMin);
    setMaxPrice(normalizedMax);

    let paramsClone = new URLSearchParams(params);
    if (normalizedMin === undefined && normalizedMax === undefined) {
      paramsClone.delete(`${FILTER_URL_PREFIX}price`);
    } else {
      const price = {
        ...(normalizedMin === undefined ? {} : { min: normalizedMin }),
        ...(normalizedMax === undefined ? {} : { max: normalizedMax }),
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
    <div className={cn("space-y-5", context === "sidebar" && "space-y-4")}>
      <p>
        {t("collection.highestPrice", {
          price: `${currencySymbol}${formatNumber(maxVariantPrice, locale, {
            maximumFractionDigits: Number.isInteger(maxVariantPrice) ? 0 : 2,
          })}`,
        })}
      </p>
      <div className="grid grid-cols-2 gap-6">
        <PriceInput
          ariaLabel={t("collection.minimumPrice")}
          currencySymbol={currencySymbol}
          min={minVariantPrice}
          max={maxVariantPrice}
          placeholder={t("collection.from")}
          value={minPrice}
          onChange={setMinPrice}
          onCommit={() => handleFilter()}
        />
        <PriceInput
          ariaLabel={t("collection.maximumPrice")}
          currencySymbol={currencySymbol}
          min={minVariantPrice}
          max={maxVariantPrice}
          placeholder={t("collection.to")}
          value={maxPrice}
          onChange={setMaxPrice}
          onCommit={() => handleFilter()}
        />
      </div>
    </div>
  );
}

function PriceInput({
  ariaLabel,
  currencySymbol,
  min,
  max,
  placeholder,
  value,
  onChange,
  onCommit,
}: {
  ariaLabel: string;
  currencySymbol: string;
  min: number;
  max: number;
  placeholder: string;
  value?: number;
  onChange: (value?: number) => void;
  onCommit: () => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-[5px]">
      <span aria-hidden="true" className="text-[#3D490B]">
        {currencySymbol}
      </span>
      <input
        aria-label={ariaLabel}
        name={ariaLabel === "Minimum price" ? "minPrice" : "maxPrice"}
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(event) => {
          const nextValue = Number.parseFloat(event.target.value);
          onChange(Number.isNaN(nextValue) ? undefined : nextValue);
        }}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="h-[46px] min-w-0 w-full rounded-lg border border-line bg-transparent px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
      />
    </label>
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
    currencyCode:
      maxVariantPrice?.currencyCode || minVariantPrice?.currencyCode || "USD",
  };
}

function getPricesFromFilter(params: URLSearchParams) {
  const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
  let price: ProductFilter["price"] | undefined;
  try {
    price = priceFilter
      ? (JSON.parse(priceFilter) as ProductFilter["price"])
      : undefined;
  } catch {
    price = undefined;
  }
  const min = Number.isNaN(Number(price?.min)) ? undefined : Number(price?.min);
  const max = Number.isNaN(Number(price?.max)) ? undefined : Number(price?.max);
  return { min, max };
}

function clampPrice(value: number | undefined, min: number, max: number) {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(Math.max(value, min), max);
}

function getCurrencySymbol(currencyCode: string, locale: string) {
  try {
    return (
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || currencyCode
    );
  } catch {
    return currencyCode;
  }
}
