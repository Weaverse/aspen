import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import clsx from "clsx";
import { type MutableRefObject, useEffect, useState } from "react";
import { useLocation } from "react-router";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import { cn } from "~/utils/cn";
import { PredictiveSearchForm } from "../search-form";
import { PopularSearch } from "./PopularSearch";
import { PredictiveSearchResult } from "./predictive-search-result";

export function PredictiveSearchButtonDesktop({ setIsSearchOpen }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  let [searchQuery, setSearchQuery] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the dialog when the location changes, aka when the user navigates to a search result page
  useEffect(() => {
    setOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setIsSearchOpen(value);
      }}
    >
      <Dialog.Trigger
        asChild
        className="hidden h-8 w-8 items-center justify-center focus-visible:outline-hidden lg:flex"
      >
        <button type="button">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 top-[calc(var(--height-nav)+var(--topbar-height))] z-3 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-x-0 top-[calc(var(--height-nav)+var(--topbar-height))] z-3 bg-(--color-header-bg)",
            "border-line-subtle border-t",
            "min-h-[300px]",
            "-translate-y-full data-[state=open]:translate-y-0",
            "data-[state=open]:animate-enter-from-top",
            "focus-visible:outline-hidden",
          ])}
          style={
            { "--enter-from-top-duration": "200ms" } as React.CSSProperties
          }
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root asChild>
            <Dialog.Title>Predictive search</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="relative p-6">
            <PredictiveSearchForm>
              {({ fetchResults, inputRef }) => (
                <div className="mx-auto mb-6 flex max-w-(--page-width) items-center gap-3 border-line-subtle border-b px-3">
                  <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-gray-500" />
                  <input
                    name="q"
                    type="search"
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      fetchResults(value);
                    }}
                    onFocus={(e) => fetchResults(e.target.value)}
                    placeholder="Enter a keyword"
                    ref={inputRef}
                    autoComplete="off"
                    className="h-full w-full py-4 focus-visible:outline-hidden"
                  />
                  <button
                    type="button"
                    className="shrink-0 p-1 text-gray-500"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.value = "";
                        setSearchQuery("");
                        fetchResults("");
                      }
                    }}
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </PredictiveSearchForm>
            {searchQuery === "" && <PopularSearch />}
            <PredictiveSearchResults />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PredictiveSearchResults() {
  const [activeType, setActiveType] = useState("products");
  const { results, totalResults, searchTerm } = usePredictiveSearch();
  const queries = results?.find(({ type }) => type === "queries");
  const articles = results?.find(({ type }) => type === "articles");
  const products = results?.find(({ type }) => type === "products");

  if (!totalResults) {
    return (
      <div className="z-10 mx-auto flex max-w-(--page-width) items-center justify-start">
        <NoResults searchTerm={searchTerm} />
      </div>
    );
  }
  return (
    <div className="z-10 w-full bg-(--color-header-bg)">
      <div className="mx-auto flex max-w-(--page-width) gap-6 overflow-hidden py-6">
        <div className="flex w-1/5 flex-col gap-4 divide-y divide-line">
          <PredictiveSearchResult type="queries" items={queries?.items} />
        </div>
        <div className="w-4/5">
          <div className="relative flex gap-6 border-line-subtle border-b">
            {["products", "articles"].map((type) => {
              const itemCount =
                type === "articles"
                  ? articles?.items?.length || 0
                  : products?.items?.length || 0;

              return (
                <button
                  type="button"
                  key={type}
                  className={clsx(
                    "relative px-3 py-1 font-normal transition",
                    activeType === type
                      ? "text-[#524B46] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[1px] after:translate-y-[1px] after:bg-[#A79D95]"
                      : "text-[#918379]",
                  )}
                  onClick={() => setActiveType(type)}
                >
                  <span className="uppercase">{type}</span>
                  <span className="ml-2 text-sm opacity-70">({itemCount})</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-4 px-4">
            {activeType === "articles" && (
              <PredictiveSearchResult type="articles" items={articles?.items} />
            )}
            {activeType === "products" && (
              <PredictiveSearchResult
                type="products"
                items={products?.items?.slice(0, 4)}
              />
            )}
          </div>
          {activeType === "products" && products?.items?.length > 0 && (
            <div className="mt-10 flex items-center justify-center">
              <Link
                to={`/search?q=${searchTerm.current}`}
                variant="secondary"
                className="flex w-fit items-center gap-2"
              >
                <span className="uppercase">View all Products</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoResults({ searchTerm }: { searchTerm: MutableRefObject<string> }) {
  if (!searchTerm.current) {
    return null;
  }
  return (
    <p className="w-[640px] bg-[--color-header-bg] p-6">
      No results found for <q>{searchTerm.current}</q>
    </p>
  );
}
