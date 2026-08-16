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
  getSeoMeta,
  Pagination,
} from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaArgs } from "react-router";
import {
  Form,
  useLoaderData,
  useLocation,
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
import { Filters } from "~/sections/collection-filters/filters";
import { LayoutSwitcher } from "~/sections/collection-filters/layout-switcher";
import { Sort } from "~/sections/collection-filters/sort";
import { cn } from "~/utils/cn";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
} from "~/utils/combined-listings";
import { PAGINATION_SIZE } from "~/utils/const";
import {
  type AppliedFilter,
  FILTER_URL_PREFIX,
  getAppliedFilterLink,
  type SortParam,
} from "~/utils/filter";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { seoPayload } from "~/utils/seo.server";

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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
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
  let highestPriceProduct: { nodes: Array<Record<string, unknown>> } = {
    nodes: [],
  };
  let lowestPriceProduct: { nodes: Array<Record<string, unknown>> } = {
    nodes: [],
  };
  let searchError: string | null = null;

  if (searchTerm) {
    try {
      const searchData = await storefront.query<SearchQuery>(SEARCH_QUERY, {
        variables: {
          searchTerm,
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
      searchError = "Search is temporarily unavailable. Please try again.";
    }
  }

  const appliedFilters = getAppliedFilters(
    filters,
    products.filters,
    storefront.i18n,
  );
  const hasResults = products.nodes.length > 0;
  const seoDescription = hasResults
    ? `Showing search results for "${searchTerm}"`
    : searchTerm
      ? `No results found for "${searchTerm}"`
      : "Search our store";
  const mockCollection = {
    id: `search:${searchTerm}`,
    title: "Search Results",
    handle: "search",
    description: "Search results",
    descriptionHtml: "Search results",
    seo: { title: "Search", description: seoDescription },
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
  };
}

export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return getSeoMeta(
    ...matches.map((match) => (match.data as any)?.seo).filter(Boolean),
  );
};

export default function Search() {
  const { searchTerm, products, appliedFilters, searchError } =
    useLoaderData<typeof loader>();
  const [gridSizeDesktop, setGridSizeDesktop] = useState(2);
  const [gridSizeMobile, setGridSizeMobile] = useState(2);
  const resultCount =
    "totalCount" in products && typeof products.totalCount === "number"
      ? products.totalCount
      : products.nodes.length;

  if (searchError) {
    return (
      <>
        <StorefrontError statusCode={500} title="Search unavailable" />
        <Analytics.SearchView data={{ searchTerm, searchResults: products }} />
      </>
    );
  }

  return (
    <>
      <Section width="fixed" verticalPadding="small" overflow="unset">
        <header className="pb-6 md:pb-8">
          <div className="flex items-stretch justify-between gap-4 md:gap-10">
            <div className="hidden flex-col gap-4 md:flex">
              <SearchHeading searchTerm={searchTerm} />
              {searchTerm && (
                <span className="py-2 uppercase">Products ({resultCount})</span>
              )}
            </div>
            <div className="flex w-full flex-col gap-4 md:w-fit md:items-end">
              <div className="md:hidden">
                <SearchHeading searchTerm={searchTerm} />
              </div>
              {searchTerm && (
                <div className="flex w-full items-center justify-between gap-2 md:w-fit md:justify-end">
                  <LayoutSwitcher
                    gridSizeDesktop={gridSizeDesktop}
                    gridSizeMobile={gridSizeMobile}
                    onGridSizeChange={(value, context) => {
                      if (context === "desktop") {
                        setGridSizeDesktop(value);
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
              )}
              {searchTerm && (
                <div className="flex w-full justify-end">
                  <div className="md:hidden">
                    <Sort
                      mode="drawer"
                      defaultSort="relevance"
                      options={SEARCH_SORT_OPTIONS}
                    />
                  </div>
                  <div className="hidden md:block">
                    <Sort
                      defaultSort="relevance"
                      options={SEARCH_SORT_OPTIONS}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <AppliedFilters filters={appliedFilters} />

        {products.nodes.length > 0 ? (
          <SearchProducts
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

function SearchHeading({ searchTerm }: { searchTerm: string }) {
  return (
    <h1 className="font-heading font-normal text-xl uppercase leading-tight tracking-[-0.03em] md:text-2xl">
      {searchTerm ? `Results for “${searchTerm}”` : "Search"}
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
  return (
    <Pagination connection={products}>
      {({
        nodes,
        isLoading,
        hasNextPage,
        hasPreviousPage,
        PreviousLink,
        NextLink,
      }) => (
        <div
          className="flex w-full flex-col items-center gap-8 md:gap-12"
          style={
            {
              "--cols-mobile": `repeat(${gridSizeMobile}, minmax(0, 1fr))`,
              "--cols-desktop": `repeat(${gridSizeDesktop}, minmax(0, 1fr))`,
            } as React.CSSProperties
          }
        >
          {hasPreviousPage && (
            <PreviousLink
              className={cn("mx-auto", variants({ variant: "outline" }))}
            >
              {isLoading ? "Loading…" : "Load previous products"}
            </PreviousLink>
          )}
          <div
            className={clsx(
              "grid w-full grid-cols-(--cols-mobile) gap-x-4 gap-y-8 md:grid-cols-(--cols-desktop) md:gap-y-12",
            )}
          >
            {nodes
              .filter(
                (product: ProductCardFragment) =>
                  !(
                    COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList &&
                    isCombinedListing(product)
                  ),
              )
              .map((product: ProductCardFragment) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
          {hasNextPage && (
            <NextLink
              className={cn(
                "mx-auto min-w-48 uppercase",
                variants({ variant: "outline" }),
              )}
            >
              {isLoading ? "Loading…" : "Load more"}
            </NextLink>
          )}
        </div>
      )}
    </Pagination>
  );
}

function AppliedFilters({ filters }: { filters: AppliedFilter[] }) {
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
          <span>{filter.label}</span>
          <XIcon aria-hidden="true" className="h-4 w-4" />
        </Link>
      ))}
      <Link
        to={`${location.pathname}?${clearAllParams.toString()}`}
        variant="underline"
        preventScrollReset
      >
        Clear all filters
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
            ? "No products match your filters"
            : searchTerm
              ? `No results for “${searchTerm}”`
              : "What are you looking for?"}
        </h2>
        <p className="text-body-subtle">
          {hasAppliedFilters
            ? "Try removing a filter to see more products."
            : searchTerm
              ? "Check the spelling or try a broader search term."
              : "Search by product name, material, room, or collection."}
        </p>
      </div>
      {hasAppliedFilters ? (
        <Link
          to={`${location.pathname}?${clearFilterParams.toString()}`}
          className={variants({ variant: "outline" })}
          preventScrollReset
        >
          Clear filters
        </Link>
      ) : (
        <SearchPageForm defaultValue={searchTerm} />
      )}
    </div>
  );
}

function SearchPageForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <Form method="get" className="flex w-full max-w-md border-b border-line">
      <label htmlFor="search-page-query" className="sr-only">
        Search products
      </label>
      <input
        id="search-page-query"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search products"
        className="h-12 min-w-0 flex-1 bg-transparent px-1 outline-none"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="flex h-12 w-12 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
      >
        <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5" />
      </button>
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
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="flex h-11 items-center gap-1.5 rounded-sm border px-4 py-2 md:h-12"
          animate={false}
          disabled={disabled}
          aria-label={
            appliedFiltersCount
              ? `Filter products, ${appliedFiltersCount} active`
              : "Filter products"
          }
        >
          <SlidersIcon aria-hidden="true" size={18} />
          <span className="uppercase">
            Filter{appliedFiltersCount ? ` (${appliedFiltersCount})` : ""}
          </span>
        </Button>
      </Dialog.Trigger>
      <AnimatedDrawer open={open}>
        <div className="flex h-full flex-col">
          <div className="flex min-h-10 shrink-0 items-center justify-between px-[52px]">
            <Dialog.Title className="text-sm font-semibold uppercase">
              Filter
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                aria-label="Close filter drawer"
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
  const {
    searchEditorialImage,
    searchEditorialHeading = "Decorate for holidays and beyond",
    searchEditorialLinkText = "Explore now",
    searchEditorialLink = "/collections",
  } = useThemeSettings();

  if (!searchEditorialImage?.url) {
    return null;
  }

  return (
    <section className="mx-auto mb-16 w-[calc(100%-2*var(--page-padding))] max-w-(--page-width) overflow-hidden rounded-xl border border-line-subtle md:mb-24">
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
