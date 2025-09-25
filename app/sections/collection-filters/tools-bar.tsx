import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useState } from "react";
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

function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
}) {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsAnimating(false);
      setOpen(true);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
      }, 300);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
          className={clsx(
            "fixed inset-0 z-10 bg-black/50 transition-opacity duration-300",
            open && !isAnimating ? "opacity-100" : "opacity-0",
          )}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 right-0 z-10 w-full bg-(--color-background) py-4 md:max-w-[430px]",
            "transition-transform duration-300 ease-in-out",
            "data-[state=open]:animate-enter-from-right",
            open && !isAnimating ? "translate-x-0" : "translate-x-full",
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
              <Filters className="px-[52px]" />
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
