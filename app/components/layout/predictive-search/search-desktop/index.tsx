import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import type { NormalizedPredictiveSearchResultItem } from "~/types/predictive-search";
import { PopularSearch } from "../PopularSearch";
import { PredictiveSearchForm } from "../search-form";
import { PredictiveSearchResult } from "./predictive-search-result";

type ResourceType = "products" | "collections" | "pages";

export function PredictiveSearchButtonDesktop({ setIsSearchOpen }) {
  const [open, setOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { results, searchState } = usePredictiveSearch();
  const loading = isSearching || searchState !== "idle";
  const hasResourceResults = results?.some(
    (result) =>
      (result.type === "products" ||
        result.type === "collections" ||
        result.type === "pages") &&
      result.items.length > 0,
  );
  const showEmptyResults = hasSearched && !loading && !hasResourceResults;

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the dialog after navigation
  useEffect(() => {
    setOpen(false);
    setIsSearchOpen(false);
    setHasSearched(false);
    setIsSearching(false);
  }, [location]);

  function resetSearchState() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setHasSearched(false);
    setIsSearching(false);
  }

  function goToSearch(value: string) {
    const query = value.trim();
    if (!query) {
      return;
    }
    rememberSearch(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setIsSearchOpen(nextOpen);
        if (!nextOpen) {
          resetSearchState();
        }
      }}
    >
      <Dialog.Trigger
        asChild
        className="relative hidden size-5 items-center justify-center focus-visible:outline-hidden before:absolute before:-inset-2 xl:flex"
      >
        <button type="button" aria-label="Open search">
          <MagnifyingGlassIcon aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay forceMount>
                <motion.div
                  className="fixed inset-0 top-[calc(var(--height-nav)+var(--topbar-height))] z-9 bg-black/50 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="fixed inset-x-0 top-[calc(var(--height-nav)+var(--topbar-height))] z-9"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                  className="max-h-[calc(100vh-var(--height-nav)-var(--topbar-height))] w-full overflow-y-auto border-line-subtle border-t bg-(--color-header-bg)"
                >
                  <VisuallyHidden.Root asChild>
                    <Dialog.Title>Predictive search</Dialog.Title>
                  </VisuallyHidden.Root>
                  <PredictiveSearchForm
                    key={open ? "open" : "closed"}
                    limit={10}
                  >
                    {({ fetchResults, inputRef }) => (
                      <div className="mx-auto flex h-[73px] w-[calc(100%-4rem)] max-w-[1360px] items-center gap-3 border-[#9D9D9D] border-b">
                        <button
                          type="button"
                          className="flex size-5 shrink-0 items-center justify-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                          aria-label="Search"
                          onClick={() => {
                            const value = inputRef.current?.value.trim() || "";
                            if (value) {
                              if (debounceRef.current) {
                                clearTimeout(debounceRef.current);
                              }
                              setHasSearched(true);
                              setIsSearching(false);
                              fetchResults(value);
                            }
                          }}
                        >
                          <MagnifyingGlassIcon
                            aria-hidden="true"
                            className="size-4"
                          />
                        </button>
                        <input
                          name="q"
                          type="search"
                          onChange={(event) => {
                            const value = event.target.value;
                            const trimmed = value.trim();

                            if (debounceRef.current) {
                              clearTimeout(debounceRef.current);
                            }

                            if (!trimmed) {
                              setHasSearched(false);
                              setIsSearching(false);
                              fetchResults("");
                              return;
                            }

                            setIsSearching(true);
                            debounceRef.current = setTimeout(() => {
                              setHasSearched(true);
                              setIsSearching(false);
                              fetchResults(trimmed);
                            }, 300);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              if (debounceRef.current) {
                                clearTimeout(debounceRef.current);
                              }
                              goToSearch(inputRef.current?.value || "");
                            }
                          }}
                          placeholder="Enter a keyword"
                          ref={inputRef}
                          autoComplete="off"
                          className="h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-0 text-[#343231] text-sm shadow-none outline-none focus-visible:!border-0 focus-visible:!shadow-none"
                        />
                      </div>
                    )}
                  </PredictiveSearchForm>
                  <div className="mx-auto w-[calc(100%-4rem)] max-w-[1360px]">
                    <AnimatePresence mode="wait" initial={false}>
                      {!(hasSearched || loading) && (
                        <motion.div
                          key="popular"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="py-7"
                        >
                          <PopularSearch
                            className="pb-6"
                            itemClassName="text-sm"
                            useSearchHistory
                          />
                        </motion.div>
                      )}
                      {loading && (
                        <motion.div
                          key="searching"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex min-h-[165px] items-center justify-center gap-2 text-body-subtle text-sm"
                          aria-live="polite"
                        >
                          <CircleNotchIcon
                            aria-hidden="true"
                            className="size-5 animate-spin"
                          />
                          <span>Searching…</span>
                        </motion.div>
                      )}
                      {hasSearched && !loading && (
                        <motion.div
                          key={showEmptyResults ? "empty" : "results"}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <PredictiveSearchResults />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PredictiveSearchResults() {
  const [activeType, setActiveType] = useState<ResourceType>("products");
  const { results, searchTerm, searchTermValue } = usePredictiveSearch();
  const queries = results?.find(({ type }) => type === "queries");
  const products = results?.find(({ type }) => type === "products");
  const collections = results?.find(({ type }) => type === "collections");
  const pages = results?.find(({ type }) => type === "pages");
  const hasResourceResults = Boolean(
    products?.items.length || collections?.items.length || pages?.items.length,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset to the product tab for each new query
  useEffect(() => {
    setActiveType("products");
  }, [searchTermValue]);

  if (!hasResourceResults) {
    return <NoResults queries={queries?.items} searchTerm={searchTermValue} />;
  }

  const minHeight = {
    products: "min-h-[598px]",
    collections: "min-h-[359px]",
    pages: "min-h-[355px]",
  }[activeType];

  return (
    <div
      className={clsx(
        "grid grid-cols-[258px_minmax(0,1fr)] gap-5 pt-7",
        minHeight,
      )}
    >
      <SuggestionsPanel items={queries?.items} fallbackTerm={searchTermValue} />
      <main className="min-w-0">
        <ResourceTabs
          activeType={activeType}
          counts={{
            products: products?.items.length || 0,
            collections: collections?.items.length || 0,
            pages: pages?.items.length || 0,
          }}
          onChange={setActiveType}
        />
        <div className="pt-5">
          {activeType === "products" && (
            <PredictiveSearchResult
              type="products"
              items={products?.items.slice(0, 4)}
            />
          )}
          {activeType === "collections" && (
            <PredictiveSearchResult
              type="collections"
              items={collections?.items.slice(0, 4)}
            />
          )}
          {activeType === "pages" && (
            <PredictiveSearchResult
              type="pages"
              items={pages?.items.slice(0, 8)}
            />
          )}
        </div>
        {activeType === "products" && products?.items.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              to={`/search?q=${encodeURIComponent(searchTerm.current)}`}
              className="flex h-[54px] items-center rounded-lg bg-[#F0EFED] px-6 font-semibold text-sm uppercase"
            >
              View all products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function SuggestionsPanel({
  items,
  fallbackTerm,
}: {
  items?: NormalizedPredictiveSearchResultItem[];
  fallbackTerm: string;
}) {
  return (
    <aside aria-labelledby="desktop-search-suggestions">
      <h2
        id="desktop-search-suggestions"
        className="flex h-7 items-start border-[#D8D8D8] border-b font-semibold text-[#524B46] text-sm uppercase leading-5"
      >
        Suggestions
      </h2>
      <div className="pt-[22px]">
        {items?.length ? (
          <PredictiveSearchResult type="queries" items={items.slice(0, 5)} />
        ) : fallbackTerm ? (
          <Link
            to={`/search?q=${encodeURIComponent(fallbackTerm)}`}
            className="font-semibold text-[#343231] text-sm"
          >
            {fallbackTerm}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function ResourceTabs({
  activeType,
  counts,
  onChange,
}: {
  activeType: ResourceType;
  counts: Record<ResourceType, number>;
  onChange: (type: ResourceType) => void;
}) {
  return (
    <div className="flex h-7 gap-10 border-[#D8D8D8] border-b">
      {(["products", "collections", "pages"] as const).map((type) => (
        <button
          type="button"
          key={type}
          className={clsx(
            "relative h-7 pb-3 font-semibold text-sm uppercase leading-5 outline-none transition-colors after:absolute after:right-0 after:-bottom-px after:left-0 after:h-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
            activeType === type
              ? "text-[#343231] after:bg-[#9D9D9D]"
              : "text-[#979797] after:bg-transparent",
          )}
          onClick={() => onChange(type)}
        >
          {type === "pages" ? "Page" : type} ({counts[type]})
        </button>
      ))}
    </div>
  );
}

function NoResults({
  queries,
  searchTerm,
}: {
  queries?: NormalizedPredictiveSearchResultItem[];
  searchTerm: string;
}) {
  if (!searchTerm) {
    return null;
  }

  return (
    <div
      className="grid min-h-[165px] grid-cols-[258px_minmax(0,1fr)] gap-5 pt-7 text-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <SuggestionsPanel items={queries} fallbackTerm={searchTerm} />
      <div>
        <div className="flex h-7 border-[#D8D8D8] border-b">
          <p className="relative h-7 pb-3 font-semibold text-[#524B46] uppercase leading-5 after:absolute after:right-0 after:-bottom-px after:left-0 after:h-px after:bg-[#9D9D9D]">
            Products
          </p>
        </div>
        <p className="pt-[27px] text-[#524B46]">
          No results for “{searchTerm}”
        </p>
      </div>
    </div>
  );
}

function rememberSearch(value: string) {
  try {
    const raw = localStorage.getItem("searchHistory");
    const parsed = raw ? JSON.parse(raw) : [];
    const history = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(
      "searchHistory",
      JSON.stringify([...history, value.toLowerCase()].slice(-50)),
    );
  } catch {
    // Search still works when storage is unavailable.
  }
}
