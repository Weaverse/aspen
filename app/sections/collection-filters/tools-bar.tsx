import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { AnimatedDrawer } from "~/components/animate-drawer";
import { Button } from "~/components/button";
import { ScrollArea } from "~/components/scroll-area";
import { cn } from "~/utils/cn";
import type { AppliedFilter } from "~/utils/filter";
import { Filters } from "./filters";
import { LayoutSwitcher, type LayoutSwitcherProps } from "./layout-switcher";
import { Sort } from "./sort";

interface ToolsBarProps extends LayoutSwitcherProps {
  enableSort: boolean;
  showProductsCount: boolean;
  enableFilter: boolean;
  filtersPosition: "sidebar" | "drawer";
  expandFilters: boolean;
  showFiltersCount: boolean;
}

export function ToolsBar({
  enableSort,
  enableFilter,
  filtersPosition,
  showProductsCount,
  gridSizeDesktop,
  gridSizeMobile,
  onGridSizeChange,
}: ToolsBarProps) {
  const { t } = useTranslation();
  const { collection, appliedFilters = [] } = useLoaderData<
    CollectionQuery & { appliedFilters: AppliedFilter[] }
  >();
  const showFilterTrigger = enableFilter;
  const productCount = collection.products.nodes.length;
  const hasFilters = Boolean(collection.products.filters?.length);

  return (
    <header className="pb-6 md:pb-8">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch md:gap-x-8 lg:grid-cols-[50%_minmax(0,1fr)] xl:gap-x-10">
        <div className="flex min-w-0 w-full flex-col gap-4 md:justify-between">
          <h1 className="self-stretch text-left font-heading font-normal text-[37px] uppercase leading-[110%] tracking-[-0.74px] text-[var(--color-text,#343231)] md:max-w-full md:break-words">
            {collection.title}
          </h1>
          {showProductsCount && (
            <p className="flex h-12 items-center uppercase">
              {t("collection.products")} ({productCount})
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-4 md:w-auto md:items-end md:justify-between">
          <div className="flex w-full items-center justify-between gap-2 md:w-fit md:justify-end md:gap-3">
            <LayoutSwitcher
              className={cn(
                "flex-row overflow-hidden rounded-xl border border-[#9D9D9D]",
                "[&>button]:border-0 [&>button]:text-[#C8C8C8]",
                '[&>button[data-active="true"]]:text-[#8A8A8A]',
                "[&>button+button]:border-[#D8D8D8] [&>button+button]:border-l",
              )}
              mobileColumns={[1, 2]}
              gridSizeDesktop={gridSizeDesktop}
              gridSizeMobile={gridSizeMobile}
              onGridSizeChange={onGridSizeChange}
            />
            {showFilterTrigger && (
              <FiltersDrawer
                filtersPosition={filtersPosition}
                appliedFiltersCount={appliedFilters.length}
                disabled={!hasFilters}
              />
            )}
          </div>
          {enableSort && (
            <div className="flex w-full justify-end md:w-fit">
              <Sort />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function FiltersDrawer({
  filtersPosition,
  appliedFiltersCount,
  disabled,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
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
          className={cn(
            "flex h-12 min-w-[102px] items-center gap-1.5 rounded-xl !px-5 !py-2",
            filtersPosition === "sidebar" && "lg:hidden",
          )}
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
