import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { type MutableRefObject, useEffect, useState } from "react";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import { cn } from "~/utils/cn";
import { PredictiveSearchResult } from "./predictive-search-result";
import { PredictiveSearchForm } from "../search-form";
import { PopularSearch } from "./PopularSearch";
import clsx from "clsx";
import { useLocation } from "react-router";

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
        className="flex lg:hidden h-8 w-8 items-center justify-center focus-visible:outline-none"
      >
        <button type="button">
          <MagnifyingGlass className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-y-0 w-screen max-w-[400px] bg-(--color-header-bg) z-10",
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
            <div className="flex gap-2 items-center justify-between py-2.5">
              <Dialog.Title asChild className="">
                <span className="font-semibold uppercase">Search</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close cart drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <PredictiveSearchForm>
              {({ fetchResults, inputRef }) => (
                <div className="flex items-center gap-3 max-w-(--page-width) mx-auto my-4 border-b border-line-subtle">
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
                    className="focus-visible:outline-none w-full h-full py-4"
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
  const [activeType, setActiveType] = useState("articles");
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
    <div className="w-full z-10 bg-[--color-header-bg]">
      <div className="flex flex-col gap-6 overflow-y-auto max-w-(--page-width) mx-auto max-h-[80vh]">
        <div className="flex flex-col gap-4 divide-y divide-line">
          <PredictiveSearchResult type="queries" items={queries?.items} />
        </div>
        <div className="">
          <div className="flex gap-6 border-b border-line-subtle">
            {["articles", "products"].map((type) => (
              <button
                key={type}
                type="button"
                className={clsx(
                  "relative uppercase font-normal px-3 py-1 transition",
                  activeType === type
                    ? "border-b border-[#A79D95] font-medium text-body -mb-[2px]"
                    : "text-body-subtle",
                )}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-4">
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
            <div className="mt-4">
              <Link
                to={`/search?q=${searchTerm.current}`}
                variant="secondary"
                className="flex items-center gap-2 w-fit"
              >
                <span className=" uppercase">View all Products</span>
                <ArrowRight className="w-4 h-4" />
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
