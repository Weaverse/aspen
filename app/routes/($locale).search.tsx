import { FunnelXIcon, SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Analytics,
  getPaginationVariables,
  getSeoMeta,
  Pagination,
} from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import type { LoaderFunctionArgs, MetaArgs } from "@shopify/remix-oxygen";
import { clsx } from "clsx";
import React, { useState } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import type {
  ProductCardFragment,
  SearchQuery,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { FiltersSearchPage } from "~/components/layout/filter-search-page";
import { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
// Removed recommendations/swimlane to match collection-filters display
import { LayoutSwitcher } from "~/sections/collection-filters/layout-switcher";
import { Sort } from "~/sections/collection-filters/sort";
import { cn } from "~/utils/cn";
import { PAGINATION_SIZE } from "~/utils/const";
import type { SortParam } from "~/utils/filter";
import { FILTER_URL_PREFIX } from "~/utils/filter";
import { seoPayload } from "~/utils/seo.server";

export async function loader({
  request,
  context: { storefront },
}: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("q");
  const sortParam = searchParams.get("sort") as SortParam | null;
  const { sortKey, reverse } = getSortValuesFromParam(sortParam);

  // Parse filters from URL (for appliedFilters UI only on search page)
  const filters = [...searchParams.entries()].reduce((flt, [key, value]) => {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      const filterKey = key.substring(FILTER_URL_PREFIX.length);
      flt.push({
        [filterKey]: JSON.parse(value),
      } as ProductFilter);
    }
    return flt;
  }, [] as ProductFilter[]);

  // Use a relaxed type here to allow reading products.filters from the query
  let products: any = {
    nodes: [],
    pageInfo: null,
  };

  if (searchTerm) {
    const variables = getPaginationVariables(request, {
      pageBy: PAGINATION_SIZE,
    });

    // Step 1: Get search results (always)
    const searchData = await storefront.query<SearchQuery>(SEARCH_QUERY, {
      variables: {
        searchTerm,
        sortKey,
        reverse,
        ...variables,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    });

    let searchProducts = searchData.products as any;

    // Step 2: Add static filters to search results
    const staticFilters = createStaticFiltersForSearch();

    // Combine search results with static filters
    products = {
      ...searchProducts,
      filters: staticFilters,
    };
  }

  // Build appliedFilters similar to collections route (best-effort if products.filters present)
  const allFilterValues = (products?.filters || []).flatMap(
    (f: any) => f.values,
  );
  const locale = storefront.i18n;
  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find((value: any) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        if (valueInput.price && (filter as any).price) {
          return true;
        }
        return JSON.stringify(valueInput) === JSON.stringify(filter);
      });
      if (!foundValue) {
        return null;
      }
      if (foundValue.id === "filter.v.price") {
        const input = JSON.parse(foundValue.input as string) as ProductFilter;
        const min = parseAsCurrency(input.price?.min ?? 0, locale);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, locale)
          : "";
        const label = min && max ? `${min} - ${max}` : "Price";
        return { filter, label };
      }
      return { filter, label: foundValue.label };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const hasResults = products?.nodes?.length > 0;
  let seoDescription = "";
  if (hasResults) {
    seoDescription = `Showing ${products.nodes.length} search results for "${searchTerm}"`;
  } else if (searchTerm) {
    seoDescription = `No results found for "${searchTerm}"`;
  } else {
    seoDescription = "Search our store";
  }

  // Create a mock collection object to match FiltersSearchPage expectations
  const mockCollection = {
    id: "search",
    title: "Search Results",
    handle: "search",
    description: "Search results",
    descriptionHtml: "Search results",
    seo: { title: "Search", description: seoDescription },
    metafields: [],
    products: {
      nodes: products?.nodes || [],
      filters: products?.filters || [],
      pageInfo: products?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
    updatedAt: new Date().toISOString(),
    // Add price range products for PriceRangeFilter
    highestPriceProduct: {
      nodes:
        products?.nodes?.length > 0
          ? [
              products.nodes.reduce((max, product) => {
                const maxPrice = Number.parseFloat(
                  product.priceRange?.maxVariantPrice?.amount || "0",
                );
                const currentMaxPrice = Number.parseFloat(
                  max.priceRange?.maxVariantPrice?.amount || "0",
                );
                return maxPrice > currentMaxPrice ? product : max;
              }, products.nodes[0]),
            ]
          : [],
    },
    lowestPriceProduct: {
      nodes:
        products?.nodes?.length > 0
          ? [
              products.nodes.reduce((min, product) => {
                const minPrice = Number.parseFloat(
                  product.priceRange?.minVariantPrice?.amount || "999999",
                );
                const currentMinPrice = Number.parseFloat(
                  min.priceRange?.minVariantPrice?.amount || "999999",
                );
                return minPrice < currentMinPrice ? product : min;
              }, products.nodes[0]),
            ]
          : [],
    },
  };

  return {
    seo: seoPayload.collection({
      url: request.url,
      collection: mockCollection,
    }),
    searchTerm,
    products,
    appliedFilters,
    collection: mockCollection, // Add collection to match FiltersSearchPage expectations
  };
}

export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return getSeoMeta(
    ...matches.map((match) => (match.data as any)?.seo).filter(Boolean),
  );
};

// Removed popular searches to match collection-filters

export default function Search() {
  const { searchTerm, products, collection } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [gridSizeDesktop, setGridSizeDesktop] = useState(2);
  const [gridSizeMobile, setGridSizeMobile] = useState(1);

  // Extract applied filters from URL params
  const appliedFilters = [...searchParams.entries()]
    .filter(([key]) => key.startsWith("filter."))
    .map(([key, value]) => {
      try {
        return { key, value: JSON.parse(value) };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  // Client-side filtering since Search API doesn't support filters
  const filteredProducts = React.useMemo(() => {
    if (!products?.nodes || appliedFilters.length === 0) {
      return products?.nodes || [];
    }

    return products.nodes.filter((product: any) => {
      return appliedFilters.every(({ key, value }) => {
        if (key === "filter.v.availability") {
          const expected = value["v.availability"];
          const actual =
            product.selectedOrFirstAvailableVariant?.availableForSale;
          return expected ? actual : !actual;
        }
        if (key === "filter.p.product_type") {
          const expected = value["p.product_type"];
          const actual = product.productType;
          return actual === expected;
        }
        if (key === "filter.p.vendor") {
          const expected = value["p.vendor"];
          const actual = product.vendor;
          return actual === expected;
        }
        if (key === "filter.v.price") {
          const price = Number.parseFloat(
            product.priceRange?.minVariantPrice?.amount || "0",
          );
          const { min, max } = value["v.price"];
          return price >= min && (!max || price <= max);
        }
        return true;
      });
    });
  }, [products?.nodes, appliedFilters]);

  const hasResults = filteredProducts.length > 0;

  return (
    <Section width="fixed" verticalPadding="medium">
      {/* Tools bar to match collection-filters */}
      <div className="py-3">
        <div className="flex items-stretch justify-between gap-4 md:gap-8">
          <div className="hidden flex-col justify-start gap-4 self-stretch md:flex">
            <h4 className="hidden uppercase tracking-tighter md:block">{`RESULTS FOR "${searchTerm || ""}"`}</h4>
            <span className="hidden py-2 uppercase md:inline">
              products ({filteredProducts.length}
              {appliedFilters.length > 0
                ? ` of ${products?.nodes?.length || 0}`
                : ""}
              )
            </span>
          </div>
          <div className="flex w-full flex-col justify-end gap-4 md:w-fit">
            <h4 className="block uppercase tracking-tighter md:hidden">{`RESULTS FOR "${searchTerm || ""}"`}</h4>
            <div className="flex w-full items-end justify-between gap-2 md:w-fit md:justify-end">
              <LayoutSwitcher
                gridSizeDesktop={gridSizeDesktop}
                gridSizeMobile={gridSizeMobile}
                onGridSizeChange={(v, context) => {
                  if (context === "desktop") setGridSizeDesktop(v);
                  else setGridSizeMobile(v);
                }}
              />
              <FiltersDrawer filtersPosition={"drawer"} />
            </div>
            <div className="flex w-full justify-end">
              <Sort />
            </div>
          </div>
        </div>
      </div>
      {hasResults ? (
        <div
          className="flex w-full flex-col items-center gap-8 pt-6"
          style={
            {
              "--cols-mobile": `repeat(${gridSizeMobile}, minmax(0, 1fr))`,
              "--cols-desktop": `repeat(${gridSizeDesktop}, minmax(0, 1fr))`,
            } as React.CSSProperties
          }
        >
          {/* {appliedFilters.length > 0 && (
            <div className="mb-4 w-full text-gray-600 text-sm">
              Showing {filteredProducts.length} of{" "}
              {products?.nodes?.length || 0} products ({appliedFilters.length}{" "}
              filter{appliedFilters.length !== 1 ? "s" : ""} applied)
            </div>
          )} */}
          <div
            className={clsx([
              "w-full gap-x-4 gap-y-6 lg:gap-y-10",
              "grid grid-cols-(--cols-mobile) md:grid-cols-(--cols-desktop)",
            ])}
          >
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          {appliedFilters.length > 0 ? (
            <div className="py-8 text-center">
              <h3 className="mb-2 font-semibold text-lg">
                No products match your filters
              </h3>
              <p className="mb-4 text-gray-600">
                Found {products?.nodes?.length || 0} products for "{searchTerm}
                ", but none match your current filters.
              </p>
              <p className="text-gray-500 text-sm">
                Try adjusting or removing some filters.
              </p>
            </div>
          ) : (
            <NoResults />
          )}
        </div>
      )}
      <Analytics.SearchView
        data={{ searchTerm: searchTerm || "", searchResults: products }}
      />
    </Section>
  );
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-20">
      <FunnelXIcon size={50} weight="light" />
      <div className="text-lg">No products matched your filters.</div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: "sidebar" | "drawer";
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-12 items-center gap-1.5 border py-2",
            filtersPosition === "sidebar" && "lg:hidden",
          )}
          animate={false}
        >
          <SlidersIcon size={18} />
          <span className="uppercase">Filter</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 z-10 w-full bg-(--color-background) py-4 md:max-w-[430px]",
            "right-0 data-[state=open]:animate-enter-from-right",
          ])}
          aria-describedby={undefined}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 px-5">
              <Dialog.Title asChild className="py-2.5 font-semibold uppercase">
                <span>Filters</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="translate-x-2 p-2"
                  aria-label="Close filters drawer"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <ScrollArea className="max-h-[calc(100vh-4.5rem)]" size="sm">
              <FiltersSearchPage className="px-[52px]" />
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// No recommendations for search page to match collection-filters display

const SEARCH_QUERY = `#graphql
  query search(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: $sortKey,
      reverse: $reverse,
      query: $searchTerm
    ) {
      filters {
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
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: "PRICE" | "BEST_SELLING" | "CREATED" | "MANUAL" | "RELEVANCE";
  reverse: boolean;
} {
  switch (sortParam) {
    case "price-high-low":
      return { sortKey: "PRICE", reverse: true };
    case "price-low-high":
      return { sortKey: "PRICE", reverse: false };
    case "best-selling":
      return { sortKey: "BEST_SELLING", reverse: false };
    case "newest":
      return { sortKey: "CREATED", reverse: true };
    case "featured":
      return { sortKey: "MANUAL", reverse: false };
    default:
      return { sortKey: "RELEVANCE", reverse: false };
  }
}

// Helper function to create static filters for search page
function createStaticFiltersForSearch(): any[] {
  return [
    {
      id: "filter.v.availability",
      label: "Availability",
      type: "BOOLEAN",
      values: [
        {
          id: "filter.v.availability.1",
          label: "In stock",
          count: 0,
          input: JSON.stringify({
            "v.availability": true,
          }),
        },
        {
          id: "filter.v.availability.0",
          label: "Out of stock",
          count: 0,
          input: JSON.stringify({
            "v.availability": false,
          }),
        },
      ],
    },
    {
      id: "filter.v.price",
      label: "Price",
      type: "PRICE_RANGE",
      values: [
        {
          id: "filter.v.price.gte.0.lte.50",
          label: "$0 - $50",
          count: 0,
          input: JSON.stringify({
            "v.price": { min: 0, max: 50 },
          }),
        },
        {
          id: "filter.v.price.gte.50.lte.100",
          label: "$50 - $100",
          count: 0,
          input: JSON.stringify({
            "v.price": { min: 50, max: 100 },
          }),
        },
        {
          id: "filter.v.price.gte.100.lte.200",
          label: "$100 - $200",
          count: 0,
          input: JSON.stringify({
            "v.price": { min: 100, max: 200 },
          }),
        },
        {
          id: "filter.v.price.gte.200",
          label: "$200+",
          count: 0,
          input: JSON.stringify({
            "v.price": { min: 200 },
          }),
        },
      ],
    },
    {
      id: "filter.p.product_type",
      label: "Product Type",
      type: "LIST",
      values: [
        {
          id: "filter.p.product_type.Sofa",
          label: "Sofa",
          count: 0,
          input: JSON.stringify({
            "p.product_type": "Sofa",
          }),
        },
        {
          id: "filter.p.product_type.Chair",
          label: "Chair",
          count: 0,
          input: JSON.stringify({
            "p.product_type": "Chair",
          }),
        },
        {
          id: "filter.p.product_type.Table",
          label: "Table",
          count: 0,
          input: JSON.stringify({
            "p.product_type": "Table",
          }),
        },
        {
          id: "filter.p.product_type.Bedroom",
          label: "Bedroom",
          count: 0,
          input: JSON.stringify({
            "p.product_type": "Bedroom",
          }),
        },
      ],
    },
    {
      id: "filter.p.vendor",
      label: "Brand",
      type: "LIST",
      values: [
        {
          id: "filter.p.vendor.WeaverseAspen",
          label: "Weaverse Aspen",
          count: 0,
          input: JSON.stringify({
            "p.vendor": "Weaverse Aspen",
          }),
        },
      ],
    },
  ];
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
