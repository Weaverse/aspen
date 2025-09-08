import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react";
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

export function PredictiveSearchButtonMobile({ setIsSearchOpen }) {
  let [open, setOpen] = useState(false);
  let location = useLocation();
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
        className="flex h-8 w-8 items-center justify-center focus-visible:outline-none lg:hidden"
      >
        <button type="button">
          <MagnifyingGlass className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-y-0 z-10 w-screen max-w-[400px] bg-(--color-header-bg)",
            "left-0 data-[state=open]:animate-enter-from-left",
            "focus-visible:outline-none",
          ])}
          style={
            { "--enter-from-left-duration": "300ms" } as React.CSSProperties
          }
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root asChild>
            <Dialog.Title>Predictive search</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="relative px-5 pt-3">
            <div className="flex items-center justify-between gap-2 py-2.5">
              <Dialog.Title asChild className="">
                <span className="font-semibold uppercase">Search</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close cart drawer">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <PredictiveSearchForm>
              {({ fetchResults, inputRef }) => (
                <div className="mx-auto my-4 flex max-w-(--page-width) items-center gap-3 border-line-subtle border-b">
                  <MagnifyingGlass className="h-5 w-5 shrink-0 text-gray-500" />
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
                    className="h-full w-full py-4 focus-visible:outline-none"
                  />
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
  let { results, totalResults, searchTerm } = usePredictiveSearch();
  let queries = results?.find(({ type }) => type === "queries");
  let articles = results?.find(({ type }) => type === "articles");
  let products = results?.find(({ type }) => type === "products");

  if (!totalResults) {
    return (
      <div className="z-10 flex w-full items-center justify-center">
        <NoResults searchTerm={searchTerm} />
      </div>
    );
  }
  return (
    <div className="z-10 w-full bg-[--color-header-bg]">
      <div className="mx-auto flex max-h-[80vh] max-w-(--page-width) flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-4 divide-y divide-line">
          <PredictiveSearchResult type="queries" items={queries?.items} />
        </div>
        <div className="">
          <div className="relative flex gap-6 border-line-subtle border-b">
            {["products", "articles"].map((type) => (
              <button
                key={type}
                type="button"
                className={clsx(
                  "relative px-3 py-1 font-normal uppercase transition",
                  activeType === type
                    ? "font-medium text-body after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px] after:translate-y-[1px] after:bg-[#A79D95]"
                    : "text-body-subtle",
                )}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {activeType === "articles" && (
              <PredictiveSearchResult type="articles" items={articles?.items} />
            )}
            {activeType === "products" && (
              <PredictiveSearchResult
                type="products"
                items={products?.items?.slice(0, 5)}
              />
            )}
          </div>
          {activeType === "products" && products?.items?.length > 0 && (
            <div className="mt-9">
              <Link
                to={`/search?q=${searchTerm.current}`}
                variant="secondary"
                className="flex w-fit items-center gap-2"
              >
                <span className="uppercase">View all Products</span>
                <ArrowRight className="h-4 w-4" />
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
    <p className="w-[640px] bg-[--color-header-bg]">
      No results found for <q>{searchTerm.current}</q>
    </p>
  );
}
