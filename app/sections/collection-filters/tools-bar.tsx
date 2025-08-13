import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
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
      <div className="gap-4 md:gap-8 flex w-full items-center justify-between h-full">
        <div className="md:block hidden h-full space-y-3.5">
          <h4 className="uppercase tracking-tight">{collection.title}</h4>
          {showProductsCount && (
            <span className="hidden md:inline uppercase">
              products ({collection?.products.nodes.length})
            </span>
          )}
        </div>
        {(enableSort || (enableFilter && filtersPosition === "drawer")) && (
          <div className="flex flex-col w-full gap-4 justify-end md:w-fit">
            <div className="flex w-full justify-between items-end md:justify-end md:w-fit gap-2">
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
              <div className="w-full flex justify-end">
                <Sort />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 border py-2 h-12",
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
          className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 w-full md:max-w-[430px] bg-(--color-background) py-4 z-10",
            "right-0 data-[state=open]:animate-enter-from-right",
          ])}
          aria-describedby={undefined}
        >
          <div className="space-y-1">
            <div className="flex gap-2 items-center justify-between px-4">
              <Dialog.Title asChild className="py-2.5 font-semibold uppercase">
                <span>Filters</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-2 translate-x-2"
                  aria-label="Close filters drawer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <ScrollArea className="max-h-[calc(100vh-4.5rem)]" size="sm">
              <Filters className="px-4" />
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
