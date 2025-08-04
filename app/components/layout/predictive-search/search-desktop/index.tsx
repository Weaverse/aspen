import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { type MutableRefObject, useEffect, useState } from "react";
import { useLocation } from "react-router";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import { cn } from "~/utils/cn";
import { PredictiveSearchResult } from "./predictive-search-result";
import { PredictiveSearchForm } from "../search-form";
import { PopularSearch } from "./PopularSearch";
import clsx from "clsx";

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
        className="hidden lg:flex h-8 w-8 items-center justify-center focus-visible:outline-hidden"
      >
        <button type="button">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed top-[calc(var(--height-nav)+var(--topbar-height))] inset-0 bg-black/50 data-[state=open]:animate-fade-in z-3"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-x-0 top-[calc(var(--height-nav)+var(--topbar-height))] bg-(--color-header-bg) z-3",
            "border-t border-line-subtle",
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
                <div className="flex items-center gap-3 max-w-(--page-width) mx-auto px-3 my-6 border-b border-line-subtle">
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
                    className="focus-visible:outline-hidden w-full h-full py-4"
                  />
                  <button
                    type="button"
                    className="shrink-0 text-gray-500 p-1"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.value = "";
                        setSearchQuery("");
                        fetchResults("");
                      }
                    }}
                  >
                    <XIcon className="w-5 h-5" />
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
  const [activeType, setActiveType] = useState("articles");
  const { results, totalResults, searchTerm } = usePredictiveSearch();
  const queries = results?.find(({ type }) => type === "queries");
  const articles = results?.find(({ type }) => type === "articles");
  const products = results?.find(({ type }) => type === "products");

  if (!totalResults) {
    return (
      <div className="z-10 flex max-w-(--page-width) mx-auto items-center justify-start">
        <NoResults searchTerm={searchTerm} />
      </div>
    );
  }
  return (
    <div className="w-full z-10 bg-(--color-header-bg)">
      <div className="flex gap-6 overflow-hidden max-w-(--page-width) mx-auto py-6">
        <div className="flex flex-col gap-4 divide-y divide-line w-1/5">
          <PredictiveSearchResult type="queries" items={queries?.items} />
        </div>
        <div className="w-4/5">
          <div className="flex gap-6 border-b border-line-subtle">
            {["articles", "products"].map((type) => (
              <button
                key={type}
                className={clsx(
                  "relative uppercase font-bold px-3 py-1 transition",
                  activeType === type
                    ? "border-b-2 border-line text-body -mb-[2px]"
                    : "text-body-subtle"
                )}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-5 px-4">
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
                className="flex items-center gap-2 w-fit"
              >
                <span className=" uppercase">View all Products</span>
                <ArrowRightIcon className="w-4 h-4" />
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
