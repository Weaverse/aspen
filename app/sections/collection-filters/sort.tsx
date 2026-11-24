import { CaretDownIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { parseCollectionParams, parseSortByValue } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen/react-router";
import { useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { AnimatedDrawer } from "~/components/animate-drawer";
import { useOptionalCollectionBrowse } from "~/components/collection/browse";
import Link from "~/components/link";
import { cn } from "~/utils/cn";
import { BROWSE_SORT_BY } from "~/utils/collection-browse";
import type { SortParam } from "~/utils/filter";

const SORT_LIST: { labelKey: string; key: SortParam }[] = [
  { labelKey: "collection.relevance", key: "relevance" },
  { labelKey: "collection.featured", key: "featured" },
  { labelKey: "collection.priceLowHigh", key: "price-low-high" },
  { labelKey: "collection.priceHighLow", key: "price-high-low" },
  { labelKey: "collection.bestSelling", key: "best-selling" },
  { labelKey: "collection.newest", key: "newest" },
];

export function Sort({
  mode = "dropdown",
  defaultSort = "featured",
  options,
  resetPagination = false,
}: {
  mode?: "dropdown" | "drawer";
  defaultSort?: SortParam;
  options?: SortParam[];
  resetPagination?: boolean;
}) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const browse = useOptionalCollectionBrowse();
  const sortList = options?.length
    ? SORT_LIST.filter(({ key }) => options.includes(key))
    : SORT_LIST;
  const currentSort =
    sortList.find(
      ({ key }) =>
        key ===
        (searchParams.get("sort") ||
          Object.entries(BROWSE_SORT_BY).find(
            ([, value]) => value === searchParams.get("sort_by"),
          )?.[0]),
    ) ||
    sortList.find(({ key }) => key === defaultSort) ||
    sortList[0];

  if (mode === "drawer") {
    return (
      <SortDrawer
        currentSort={currentSort}
        pathname={location.pathname}
        searchParams={searchParams}
        sortList={sortList}
      />
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-12 w-fit items-center justify-end gap-1.5 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body">
        <span className="inline uppercase">
          {t("collection.sortBy")}:{" "}
          <span className="font-semibold">{t(currentSort.labelKey)}</span>
        </span>
        <CaretDownIcon aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-20 flex h-fit w-60 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-(--radius-md) border border-line bg-background p-6"
        >
          {sortList.map(({ key, labelKey }) => (
            <DropdownMenu.Item key={key} asChild>
              <Link
                to={getSortUrl(
                  location.pathname,
                  searchParams,
                  key,
                  resetPagination,
                )}
                onClick={(event) => {
                  if (browse) {
                    event.preventDefault();
                    const next = parseSortByValue(BROWSE_SORT_BY[key]);
                    browse.setSortKey(next.sortKey, next.reverse);
                  }
                }}
                aria-current={currentSort.key === key ? "true" : undefined}
                className={cn(
                  "-my-1.5 flex items-center justify-start self-stretch py-1.5 text-left font-body text-sm font-normal text-body uppercase leading-[1.6] tracking-[0.01em] outline-hidden hover:bg-gray-50 focus:bg-gray-50",
                  currentSort.key === key && "font-semibold tracking-[0.02em]",
                )}
                preventScrollReset
              >
                <span>{t(labelKey)}</span>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SortDrawer({
  currentSort,
  pathname,
  searchParams,
  sortList,
}: {
  currentSort: (typeof SORT_LIST)[number];
  pathname: string;
  searchParams: URLSearchParams;
  sortList: typeof SORT_LIST;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const browse = useOptionalCollectionBrowse();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-1.5 rounded-sm border border-line px-4 uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
        >
          <span>{t("collection.sort")}</span>
          <CaretDownIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <AnimatedDrawer open={open}>
        <div className="flex h-full flex-col">
          <div className="flex min-h-10 shrink-0 items-center justify-between px-[52px]">
            <Dialog.Title className="text-sm font-semibold uppercase">
              {t("collection.sortBy")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                aria-label={t("collection.closeSort")}
              >
                <XIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="divide-y divide-line-subtle border-line-subtle border-b px-[52px]">
            {sortList.map(({ key, labelKey }) => (
              <Dialog.Close key={key} asChild>
                <Link
                  to={getSortUrl(pathname, searchParams, key)}
                  preventScrollReset
                  onClick={(event) => {
                    if (browse) {
                      event.preventDefault();
                      const next = parseSortByValue(BROWSE_SORT_BY[key]);
                      browse.setSortKey(next.sortKey, next.reverse);
                    }
                  }}
                  aria-current={currentSort.key === key ? "true" : undefined}
                  className={cn(
                    "flex min-h-[62px] items-center justify-between gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
                    currentSort.key === key && "font-semibold",
                  )}
                >
                  <span>{t(labelKey)}</span>
                  {currentSort.key === key && (
                    <CheckIcon aria-hidden="true" className="h-4 w-4" />
                  )}
                </Link>
              </Dialog.Close>
            ))}
          </div>
        </div>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}

function getSortUrl(
  pathname: string,
  searchParams: URLSearchParams,
  sort: SortParam,
  resetPagination = false,
) {
  const params = new URLSearchParams(searchParams);
  if (!/\/search$/.test(pathname)) {
    params.delete("sort");
    params.set("sort_by", BROWSE_SORT_BY[sort]);
    params.delete("after");
    params.delete("before");
  } else params.set("sort", sort);
  if (resetPagination) {
    params.delete("cursor");
    params.delete("direction");
  }
  return `${pathname}?${params.toString()}`;
}
