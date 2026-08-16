import { CaretDownIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { AnimatedDrawer } from "~/components/animate-drawer";
import Link from "~/components/link";
import { cn } from "~/utils/cn";
import type { SortParam } from "~/utils/filter";

const SORT_LIST: { label: string; key: SortParam }[] = [
  { label: "Featured", key: "featured" },
  { label: "Relevance", key: "relevance" },
  { label: "Price, low to high", key: "price-low-high" },
  { label: "Price, high to low", key: "price-high-low" },
  { label: "Best selling", key: "best-selling" },
  { label: "Newest", key: "newest" },
];

export function Sort({
  mode = "dropdown",
  defaultSort = "featured",
  options,
}: {
  mode?: "dropdown" | "drawer";
  defaultSort?: SortParam;
  options?: SortParam[];
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sortList = options?.length
    ? SORT_LIST.filter(({ key }) => options.includes(key))
    : SORT_LIST;
  const currentSort =
    sortList.find(({ key }) => key === searchParams.get("sort")) ||
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
          Sort by: <span className="font-semibold">{currentSort.label}</span>
        </span>
        <CaretDownIcon aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-20 flex h-fit w-52 flex-col border border-line-subtle bg-background p-2 shadow-lg"
        >
          {sortList.map(({ key, label }) => (
            <DropdownMenu.Item key={key} asChild>
              <Link
                to={getSortUrl(location.pathname, searchParams, key)}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-3 px-3 py-2 outline-hidden hover:bg-gray-50 focus:bg-gray-50",
                  currentSort.key === key && "font-semibold",
                )}
                preventScrollReset
              >
                <span>{label}</span>
                {currentSort.key === key && (
                  <CheckIcon aria-hidden="true" className="h-4 w-4" />
                )}
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
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-1.5 rounded-sm border border-line px-4 uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
        >
          <span>Sort</span>
          <CaretDownIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <AnimatedDrawer open={open}>
        <div className="flex h-full flex-col">
          <div className="flex min-h-10 shrink-0 items-center justify-between px-[52px]">
            <Dialog.Title className="text-sm font-semibold uppercase">
              Sort by
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                aria-label="Close sort drawer"
              >
                <XIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="divide-y divide-line-subtle border-line-subtle border-b px-[52px]">
            {sortList.map(({ key, label }) => (
              <Dialog.Close key={key} asChild>
                <Link
                  to={getSortUrl(pathname, searchParams, key)}
                  preventScrollReset
                  aria-current={currentSort.key === key ? "true" : undefined}
                  className={cn(
                    "flex min-h-[62px] items-center justify-between gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
                    currentSort.key === key && "font-semibold",
                  )}
                >
                  <span>{label}</span>
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
) {
  const params = new URLSearchParams(searchParams);
  params.set("sort", sort);
  return `${pathname}?${params.toString()}`;
}
