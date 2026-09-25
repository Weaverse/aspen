import {
  FunnelXIcon,
  MagnifyingGlassIcon,
  SlidersIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Analytics,
  getPaginationVariables,
  Pagination,
  type SeoConfig,
} from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useId, useState } from "react";
import type { LoaderFunctionArgs, MetaArgs } from "react-router";
import {
  Form,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import type {
  ProductCardFragment,
  SearchQuery,
} from "storefront-api.generated";
import { AnimatedDrawer } from "~/components/animate-drawer";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import Link, { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { StorefrontError } from "~/components/root/storefront-error";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { Filters } from "~/sections/collection-filters/filters";
import { LayoutSwitcher } from "~/sections/collection-filters/layout-switcher";
import { Sort } from "~/sections/collection-filters/sort";
import { cn } from "~/utils/cn";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
  maybeFilterOutCombinedListingsQuery,
} from "~/utils/combined-listings";
import {
  type AppliedFilter,
  FILTER_URL_PREFIX,
  getAppliedFilterLink,
  type SortParam,
} from "~/utils/filter";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";
import { getMetaTranslator, localizedSeoMeta } from "~/utils/seo-translation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({
  request,
  context: { storefront },
}: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("q")?.trim() || "";
  const sortParam = searchParams.get("sort") as SortParam | null;
  const { sortKey, reverse } = getSortValuesFromParam(sortParam);
  const filters = getFiltersFromParams(searchParams);
  const gridSizeDesktop = searchParams.get("grid") === "3" ? 3 : 2;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: gridSizeDesktop === 3 ? 9 : 8,
  });

  let products = {
    nodes: [],
    filters: [],
    totalCount: 0,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  } as unknown as SearchQuery["products"];
  let highestPriceProduct: { nodes: Record<string, unknown>[] } = {
    nodes: [],
  };
  let lowestPriceProduct: { nodes: Record<string, unknown>[] } = {
    nodes: [],
  };
  let searchError: string | null = null;

  if (searchTerm) {
    try {
      const searchData = await storefront.query<SearchQuery>(SEARCH_QUERY, {
        variables: {
          searchTerm: maybeFilterOutCombinedListingsQuery
            ? `(${searchTerm}) AND ${maybeFilterOutCombinedListingsQuery}`
            : searchTerm,
          filters,
          sortKey,
          reverse,
          ...paginationVariables,
          country: storefront.i18n.country,
          language: storefront.i18n.language,
        },
      });
      products = searchData.products;
      highestPriceProduct =
        (
          searchData as SearchQuery & {
            highestPriceProduct?: typeof highestPriceProduct;
          }
        ).highestPriceProduct || highestPriceProduct;
      lowestPriceProduct =
        (
          searchData as SearchQuery & {
            lowestPriceProduct?: typeof lowestPriceProduct;
          }
        ).lowestPriceProduct || lowestPriceProduct;
    } catch (error) {
      console.error("Search request failed", error);
      searchError = "errors.searchUnavailable";
    }
  }

  const appliedFilters = getAppliedFilters(
    filters,
    products.filters,
    storefront.i18n,
  );
  const mockCollection = {
    id: `search:${searchTerm}`,
    title: "seo.searchResults",
    handle: "search",
    description: "seo.searchDescription",
    descriptionHtml: "seo.searchDescription",
    seo: { title: "seo.search", description: "seo.searchDescription" },
    metafields: [],
    products,
    updatedAt: new Date().toISOString(),
    highestPriceProduct,
    lowestPriceProduct,
  };

  return {
    seo: seoPayload.collection({
      url: request.url,
      collection: mockCollection,
    }),
    searchTerm,
    products,
    appliedFilters,
    collection: mockCollection,
    searchError,
    gridSizeDesktop,
  };
}

export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return localizedSeoMeta(
    matches,
    ...matches
      .map((match) => {
        const page = match.data as {
          seo?: SeoConfig;
          searchTerm?: string;
          products?: { nodes: unknown[] };
        };
        if (!page?.seo || page.searchTerm === undefined) {
          return page?.seo;
        }
        const t = getMetaTranslator(matches);
        return {
          ...page.seo,
          title: t("seo.search"),
          description: t(
            page.products?.nodes.length
              ? "seo.searchResultsFor"
              : page.searchTerm
                ? "seo.searchNoResultsFor"
                : "seo.searchStore",
            { term: page.searchTerm },
          ),
        };
      })
      .filter(Boolean),
  );
};

export default function Search() {
  const { t } = useTranslation();
  const { searchTerm, products, appliedFilters, searchError, gridSizeDesktop } =
    useLoaderData<typeof loader>();
  const [gridSizeMobile, setGridSizeMobile] = useState(2);
  const [searchParams, setSearchParams] = useSearchParams();
  const resultCount =
    "totalCount" in products && typeof products.totalCount === "number"
      ? products.totalCount
      : products.nodes.length;

  if (searchError) {
    return (
      <>
        <StorefrontError statusCode={500} title={t("search.unavailable")} />
        <Analytics.SearchView data={{ searchTerm, searchResults: products }} />
      </>
    );
  }

  return (
    <>
      <Section width="fixed" verticalPadding="small" overflow="unset">
        <header className="pb-6 md:pb-8">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch md:gap-x-8 lg:grid-cols-[50%_minmax(0,1fr)] xl:gap-x-10">
            <div className="flex min-w-0 w-full flex-col gap-4 md:justify-between">
              <div className="md:hidden">
                <SearchHeading searchTerm={searchTerm} stacked />
              </div>
              <div className="hidden md:block xl:hidden">
                <SearchHeading searchTerm={searchTerm} />
              </div>
              <div className="hidden xl:block">
                <SearchHeading
                  searchTerm={searchTerm}
                  resultCount={resultCount}
                />
              </div>
              {searchTerm && (
                <SearchPageForm key={searchTerm} defaultValue={searchTerm} />
              )}
            </div>
            {searchTerm && (
              <div className="flex w-full flex-col gap-4 md:w-auto md:items-end md:justify-between">
                <div className="flex w-full items-center justify-between gap-2 md:w-fit md:justify-end md:gap-3">
                  <LayoutSwitcher
                    className={cn(
                      "flex-row overflow-hidden rounded-xl border border-[#9D9D9D]",
                      "[&>button]:border-0 [&>button]:text-[#C8C8C8]",
                      '[&>button[data-active="true"]]:text-[#8A8A8A]',
                      "[&>button+button]:border-[#D8D8D8] [&>button+button]:border-l",
                    )}
                    mobileColumns={[2, 1]}
                    gridSizeDesktop={gridSizeDesktop}
                    gridSizeMobile={gridSizeMobile}
                    onGridSizeChange={(value, context) => {
                      if (context === "desktop") {
                        const nextSearchParams = new URLSearchParams(
                          searchParams,
                        );
                        if (value === 3) {
                          nextSearchParams.set("grid", "3");
                        } else {
                          nextSearchParams.delete("grid");
                        }
                        nextSearchParams.delete("cursor");
                        nextSearchParams.delete("direction");
                        setSearchParams(nextSearchParams, {
                          preventScrollReset: true,
                        });
                      } else {
                        setGridSizeMobile(value);
                      }
                    }}
                  />
                  <FiltersDrawer
                    appliedFiltersCount={appliedFilters.length}
                    disabled={!products.filters.length}
                  />
                </div>
                <div className="flex w-full justify-end md:w-fit">
                  <Sort defaultSort="relevance" options={SEARCH_SORT_OPTIONS} />
                </div>
              </div>
            )}
          </div>
        </header>

        <AppliedFilters filters={appliedFilters} />

        {products.nodes.length > 0 ? (
          <SearchProducts
            key={getSearchResultsKey(searchTerm, searchParams)}
            products={products}
            gridSizeDesktop={gridSizeDesktop}
            gridSizeMobile={gridSizeMobile}
          />
        ) : (
          <SearchEmptyState
            searchTerm={searchTerm}
            hasAppliedFilters={appliedFilters.length > 0}
          />
        )}

        <Analytics.SearchView data={{ searchTerm, searchResults: products }} />
      </Section>
      {products.nodes.length > 0 && <SearchEditorial />}
    </>
  );
}

function SearchHeading({
  searchTerm,
  resultCount,
  stacked = false,
}: {
  searchTerm: string;
  resultCount?: number;
  stacked?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <h1 className="self-stretch text-left font-heading font-normal text-[37px] uppercase leading-[110%] tracking-[-0.74px] text-[var(--color-text,#343231)] md:max-w-full md:break-words">
      {typeof resultCount === "number" && `${resultCount} `}
      {searchTerm && stacked ? (
        <>
          {t("search.resultsForLabel")}
          <span className="block">“{searchTerm}”</span>
        </>
      ) : searchTerm ? (
        t("search.resultsFor", { term: searchTerm })
      ) : (
        t("search.title")
      )}
    </h1>
  );
}

function SearchProducts({
  products,
  gridSizeDesktop,
  gridSizeMobile,
}: {
  products: SearchQuery["products"];
  gridSizeDesktop: number;
  gridSizeMobile: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mobilePageSize = getSearchMobilePageSize(gridSizeMobile);
  const [mobileVisible, setMobileVisible] = useState(mobilePageSize);

  useEffect(() => {
    setMobileVisible(mobilePageSize);
  }, [mobilePageSize]);

  return (
    <Pagination connection={products}>
      {({
        nodes,
        isLoading,
        hasNextPage,
        hasPreviousPage,
        PreviousLink,
        NextLink,
        nextPageUrl,
        state,
      }) => {
        const visibleProducts = nodes.filter(
          (product: ProductCardFragment) =>
            !(
              COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList &&
              isCombinedListing(product)
            ),
        );
        const hasHiddenMobileProducts = visibleProducts.length > mobileVisible;
        const showMobileLoadMore = hasNextPage || hasHiddenMobileProducts;

        return (
          <div className="flex w-full flex-col items-center gap-8 md:gap-12">
            {hasPreviousPage && (
              <PreviousLink
                className={cn(
                  variants({ variant: "outline" }),
                  "mx-auto hidden md:flex",
                )}
              >
                {isLoading ? t("system.loading") : t("search.loadPrevious")}
              </PreviousLink>
            )}
            <div
              className={clsx(
                "grid w-full gap-x-4 gap-y-8 md:gap-y-12",
                gridSizeMobile === 1 ? "grid-cols-1" : "grid-cols-2",
                gridSizeDesktop === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
              )}
            >
              {visibleProducts.map(
                (product: ProductCardFragment, index: number) => (
                  <div
                    key={product.id}
                    className={cn(index >= mobileVisible && "max-md:hidden")}
                  >
                    <ProductCard product={product} />
                  </div>
                ),
              )}
            </div>
            {showMobileLoadMore && (
              <button
                type="button"
                className={cn(
                  variants({ variant: "outline" }),
                  "mx-auto min-w-48 uppercase md:hidden",
                )}
                onClick={() => {
                  const nextVisible = mobileVisible + mobilePageSize;
                  setMobileVisible(nextVisible);
                  if (hasNextPage && visibleProducts.length <= nextVisible) {
                    navigate(nextPageUrl, {
                      replace: true,
                      preventScrollReset: true,
                      state,
                    });
                  }
                }}
              >
                {isLoading ? t("system.loading") : t("search.loadMore")}
              </button>
            )}
            {hasNextPage && (
              <NextLink
                className={cn(
                  variants({ variant: "outline" }),
                  "mx-auto hidden min-w-48 uppercase md:flex",
                )}
              >
                {isLoading ? t("system.loading") : t("search.loadMore")}
              </NextLink>
            )}
          </div>
        );
      }}
    </Pagination>
  );
}

function AppliedFilters({ filters }: { filters: AppliedFilter[] }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const location = useLocation();

  if (!filters.length) {
    return null;
  }

  const clearAllParams = new URLSearchParams(params);
  for (const key of Array.from(clearAllParams.keys())) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      clearAllParams.delete(key);
    }
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {filters.map((filter) => (
        <Link
          key={`${filter.label}-${JSON.stringify(filter.filter)}`}
          to={getAppliedFilterLink(filter, params, location)}
          className="flex min-h-9 items-center gap-2 border border-line-subtle px-3 py-1.5 hover:border-line"
          variant="custom"
          preventScrollReset
        >
          <span>
            {filter.label === "Price" ? t("product.price") : filter.label}
          </span>
          <XIcon aria-hidden="true" className="h-4 w-4" />
        </Link>
      ))}
      <Link
        to={`${location.pathname}?${clearAllParams.toString()}`}
        variant="underline"
        preventScrollReset
      >
        {t("collection.clearAllFilters")}
      </Link>
    </div>
  );
}

function SearchEmptyState({
  searchTerm,
  hasAppliedFilters,
}: {
  searchTerm: string;
  hasAppliedFilters: boolean;
}) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const location = useLocation();
  const clearFilterParams = new URLSearchParams(params);
  for (const key of Array.from(clearFilterParams.keys())) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      clearFilterParams.delete(key);
    }
  }

  return (
    <div className="mx-auto flex min-h-[340px] max-w-xl flex-col items-center justify-center gap-5 text-center">
      <FunnelXIcon aria-hidden="true" size={48} weight="light" />
      <div className="space-y-2">
        <h2 className="font-heading text-xl uppercase tracking-[-0.02em]">
          {hasAppliedFilters
            ? t("search.noFilterMatches")
            : searchTerm
              ? t("search.noResults", { term: searchTerm })
              : t("search.emptyTitle")}
        </h2>
        <p className="text-body-subtle">
          {hasAppliedFilters
            ? t("search.removeFilterHint")
            : searchTerm
              ? t("search.spellingHint")
              : t("search.emptyHint")}
        </p>
      </div>
      {hasAppliedFilters ? (
        <Link
          to={`${location.pathname}?${clearFilterParams.toString()}`}
          className={variants({ variant: "outline" })}
          preventScrollReset
        >
          {t("search.clearFilters")}
        </Link>
      ) : null}
    </div>
  );
}

function SearchPageForm({ defaultValue = "" }: { defaultValue?: string }) {
  const { t } = useTranslation();
  const inputId = useId();
  const [query, setQuery] = useState(() =>
    stripSearchInputQuotes(defaultValue),
  );
  return (
    <Form
      method="get"
      className="flex h-12 w-full items-center gap-3 self-stretch rounded-[var(--Radius-border-radius-md,12px)] border border-[var(--Border-Subtle,#D8D8D8)] bg-[var(--Background-Background,#FFF)] px-4 md:max-w-[calc(50vw-var(--page-padding))] lg:max-w-full"
    >
      <label htmlFor={inputId} className="sr-only">
        {t("search.searchProducts")}
      </label>
      <button
        type="submit"
        aria-label={t("search.submit")}
        className="flex h-10 w-7 shrink-0 items-center justify-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
      >
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="h-5 w-5 text-[#9D9D9D]"
        />
      </button>
      <input
        id={inputId}
        name="q"
        type="text"
        value={query}
        onChange={(event) =>
          setQuery(stripSearchInputQuotes(event.currentTarget.value))
        }
        placeholder={t("search.searchProducts")}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="h-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent p-0 font-semibold uppercase tracking-[0.04em] shadow-none outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus-visible:border-0 focus-visible:shadow-none focus-visible:outline-none"
      />
      {query && (
        <button
          type="button"
          aria-label={t("search.clearFilters")}
          onClick={() => setQuery("")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] text-[#9D9D9D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
        >
          <XIcon aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </Form>
  );
}

function FiltersDrawer({
  appliedFiltersCount,
  disabled,
}: {
  appliedFiltersCount: number;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="flex h-12 min-w-[102px] items-center gap-1.5 rounded-xl !px-5 !py-2"
          animate={false}
          disabled={disabled}
          aria-label={
            appliedFiltersCount
              ? t("collection.filterProductsActive", {
                  count: appliedFiltersCount,
                })
              : t("collection.filterProducts")
          }
        >
          <SlidersIcon aria-hidden="true" size={18} />
          <span className="uppercase">
            {t("collection.filter")}
            {appliedFiltersCount ? ` (${appliedFiltersCount})` : ""}
          </span>
        </Button>
      </Dialog.Trigger>
      <AnimatedDrawer open={open}>
        <div className="flex h-full flex-col">
          <div className="flex min-h-10 shrink-0 items-center justify-between px-[52px]">
            <Dialog.Title className="text-sm font-semibold uppercase">
              {t("collection.filter")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                aria-label={t("collection.closeFilters")}
              >
                <XIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <ScrollArea
            rootClassName="min-h-0 flex-1"
            className="h-full"
            size="sm"
          >
            <Filters context="drawer" className="mx-[52px]" />
          </ScrollArea>
        </div>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}

function SearchEditorial() {
  const translateText = useTranslatedText();

  const {
    searchEditorialImage,
    searchEditorialHeading:
      rawI18nSearchEditorialHeading = "Decorate for holidays and beyond",
    searchEditorialLinkText: rawI18nSearchEditorialLinkText = "Explore now",
    searchEditorialLink = "/collections",
  } = useTranslatedThemeSettings();
  const searchEditorialLinkText = translateText(
    rawI18nSearchEditorialLinkText,
    "themeContent.routesLocaleSearch.searchEditorialLinkText",
  );
  const searchEditorialHeading = translateText(
    rawI18nSearchEditorialHeading,
    "themeContent.routesLocaleSearch.searchEditorialHeading",
  );

  if (!searchEditorialImage?.url) {
    return null;
  }

  return (
    <section className="mx-auto mb-16 hidden w-[calc(100%-2*var(--page-padding))] max-w-(--page-width) overflow-hidden rounded-xl border border-line-subtle md:mb-24 md:block">
      <div className="relative h-[320px] md:h-[520px]">
        <Image
          data={searchEditorialImage}
          alt={searchEditorialImage.altText || ""}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          sizes="(min-width: 1440px) 1440px, calc(100vw - 2 * var(--page-padding))"
        />
        <h2 className="absolute top-10 left-6 max-w-[290px] font-heading text-[34px] uppercase leading-[1.05] tracking-[-0.04em] text-[#2f302f] md:top-16 md:left-16 md:max-w-[510px] md:text-[52px]">
          {searchEditorialHeading}
        </h2>
      </div>
      <div className="flex min-h-16 items-center bg-background px-5 md:min-h-20 md:px-6">
        <Link
          to={searchEditorialLink || "/collections"}
          variant="decor"
          className="font-semibold uppercase"
        >
          {searchEditorialLinkText}
        </Link>
      </div>
    </section>
  );
}

function getFiltersFromParams(searchParams: URLSearchParams) {
  return [...searchParams.entries()].reduce((filters, [key, value]) => {
    if (!key.startsWith(FILTER_URL_PREFIX)) {
      return filters;
    }
    const parsedValue = parseFilterParam(value);
    if (parsedValue !== undefined) {
      filters.push({
        [key.substring(FILTER_URL_PREFIX.length)]: parsedValue,
      } as ProductFilter);
    }
    return filters;
  }, [] as ProductFilter[]);
}

function getAppliedFilters(
  selectedFilters: ProductFilter[],
  availableFilters: SearchQuery["products"]["filters"],
  locale: { language: string; country: string; currency: string },
) {
  const allFilterValues = availableFilters.flatMap((filter) => filter.values);

  return selectedFilters
    .map((filter) => {
      const foundValue = allFilterValues.find((value) => {
        if (typeof value.input !== "string") {
          return false;
        }
        const valueInput = parseFilterParam(value.input) as
          | ProductFilter
          | undefined;
        if (!valueInput) {
          return false;
        }
        if (valueInput.price && filter.price) {
          return true;
        }
        return JSON.stringify(valueInput) === JSON.stringify(filter);
      });

      if (!foundValue) {
        return null;
      }
      if (foundValue.id === "filter.v.price" && filter.price) {
        const min = parseAsCurrency(filter.price.min ?? 0, locale);
        const max = filter.price.max
          ? parseAsCurrency(filter.price.max, locale)
          : "";
        return { filter, label: min && max ? `${min} - ${max}` : "Price" };
      }
      return { filter, label: foundValue.label };
    })
    .filter((filter): filter is AppliedFilter => filter !== null);
}

function parseFilterParam(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseAsCurrency(
  value: number,
  locale: { language: string; country: string; currency: string },
) {
  return new Intl.NumberFormat(`${locale.language}-${locale.country}`, {
    style: "currency",
    currency: locale.currency,
  }).format(value);
}

function getSearchMobilePageSize(gridSizeMobile: number) {
  return gridSizeMobile === 1 ? 6 : 8;
}

function stripSearchInputQuotes(value: string) {
  return value.replace(/^[“”"«»]+|[“”"«»]+$/g, "");
}

function getSearchResultsKey(
  searchTerm: string,
  searchParams: URLSearchParams,
) {
  const params = new URLSearchParams(searchParams);
  params.delete("cursor");
  params.delete("direction");
  return `${searchTerm}:${params.toString()}`;
}

const SEARCH_SORT_OPTIONS: SortParam[] = [
  "relevance",
  "price-low-high",
  "price-high-low",
];

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: "PRICE" | "RELEVANCE";
  reverse: boolean;
} {
  switch (sortParam) {
    case "price-high-low":
      return { sortKey: "PRICE", reverse: true };
    case "price-low-high":
      return { sortKey: "PRICE", reverse: false };
    default:
      return { sortKey: "RELEVANCE", reverse: false };
  }
}

const SEARCH_QUERY = `#graphql
  query search(
    $country: CountryCode
    $endCursor: String
    $filters: [ProductFilter!]
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String!
    $startCursor: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products: search(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      productFilters: $filters
      sortKey: $sortKey
      reverse: $reverse
      query: $searchTerm
      types: [PRODUCT]
    ) {
      filters: productFilters {
        id
        label
        type
        values {
          id
          label
          count
          input
        }
      }
      totalCount
      nodes {
        ... on Product {
          ...ProductCard
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
    highestPriceProduct: search(
      first: 1
      query: $searchTerm
      sortKey: PRICE
      reverse: true
      types: [PRODUCT]
    ) {
      nodes {
        ... on Product {
          ...SearchPriceProduct
        }
      }
    }
    lowestPriceProduct: search(
      first: 1
      query: $searchTerm
      sortKey: PRICE
      types: [PRODUCT]
    ) {
      nodes {
        ... on Product {
          ...SearchPriceProduct
        }
      }
    }
  }
  fragment SearchPriceProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
