import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { AnimatedDrawer } from "~/components/animate-drawer";
import { Button } from "~/components/button";
import { ScrollArea } from "~/components/scroll-area";
import { cn } from "~/utils/cn";
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
  const { collection } = useLoaderData<CollectionQuery>();
  return (
    <div className="py-3">
      <div className="flex items-stretch justify-between gap-4 md:gap-8">
        <div className="hidden flex-col justify-start gap-4 self-stretch md:flex">
          <h4 className="uppercase tracking-tighter">{collection.title}</h4>
          {showProductsCount && (
            <span className="hidden py-2 uppercase md:inline">
              products ({collection?.products.nodes.length})
            </span>
          )}
        </div>
        {(enableSort || (enableFilter && filtersPosition === "drawer")) && (
          <div className="flex w-full flex-col justify-end gap-4 md:w-fit">
            <div className="flex w-full items-end justify-between gap-2 md:w-fit md:justify-end">
              <LayoutSwitcher
                gridSizeDesktop={gridSizeDesktop}
                gridSizeMobile={gridSizeMobile}
                onGridSizeChange={onGridSizeChange}
              />
              {enableFilter && (
                <FiltersDrawer filtersPosition={filtersPosition} />
              )}
            </div>
            {enableSort && (
              <div className="flex w-full justify-end">
                <Sort />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export let toggleCartDrawer = (_open: boolean) => {};
function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
}) {
  const [open, setOpen] = useState(false);
  toggleCartDrawer = setOpen;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
      <AnimatedDrawer open={open}>
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
            <Filters className="px-[52px]" />
          </ScrollArea>
        </div>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}
