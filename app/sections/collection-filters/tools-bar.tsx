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

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4 md:items-stretch md:gap-8">
        <div className="hidden flex-col justify-start gap-4 self-stretch md:flex">
          <h4 className="uppercase tracking-tighter">{collection.title}</h4>
          {showProductsCount && (
            <span className="py-2 uppercase">
              {t("collection.products")} ({collection.products.nodes.length})
            </span>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-2 md:w-fit md:justify-end">
          <LayoutSwitcher
            gridSizeDesktop={gridSizeDesktop}
            gridSizeMobile={gridSizeMobile}
            onGridSizeChange={onGridSizeChange}
          />
          <div className="flex items-center gap-2">
            {showFilterTrigger && (
              <FiltersDrawer
                filtersPosition={filtersPosition}
                appliedFiltersCount={appliedFilters.length}
              />
            )}
            {enableSort && (
              <>
                <div className="md:hidden">
                  <Sort mode="drawer" />
                </div>
                <div className="hidden md:block">
                  <Sort />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
  appliedFiltersCount,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
  appliedFiltersCount: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-sm border px-4 py-2 md:h-12",
            filtersPosition === "sidebar" && "lg:hidden",
          )}
          animate={false}
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
          <div className="flex min-h-10 shrink-0 items-center justify-between pr-2 pl-[52px]">
            <Dialog.Title className="-translate-y-0.5 text-sm font-semibold uppercase tracking-[0.02em]">
              {t("collection.filter")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center outline-none"
                aria-label={t("collection.closeFilters")}
              >
                <XIcon
                  aria-hidden="true"
                  className="h-4 w-4 -translate-y-[3px]"
                />
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
