import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { NormalizedPredictiveSearchResultItem } from "~/types/predictive-search";
import { PopularSearch } from "../PopularSearch";
import { withPinnedCollections } from "../pinned-collections";
import { PredictiveSearchForm } from "../search-form";
import { PredictiveSearchResult } from "./predictive-search-result";

type ResourceType = "products" | "collections" | "pages";

export function PredictiveSearchButtonDesktop({ setIsSearchOpen }) {
  const { t } = useTranslation();
  const searchRoute = usePrefixPathWithLocale("/search");
  const [open, setOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueryRef = useRef<string | null>(null);
  const previousRequestRef = useRef<FormData | undefined>(undefined);
  const { searchState, searchTermValue, searchRequest } = usePredictiveSearch();
  const loading = isSearching || searchState !== "idle";

  // An older request must not take ownership of the next query's loading state.
  useEffect(() => {
    if (
      isSearching &&
      !debounceRef.current &&
      searchState !== "idle" &&
      searchRequest !== previousRequestRef.current &&
      searchTermValue === pendingQueryRef.current
    ) {
      setIsSearching(false);
    }
  }, [isSearching, searchState, searchTermValue, searchRequest]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the dialog after navigation
  useEffect(() => {
    setOpen(false);
    setIsSearchOpen(false);
    resetSearchState();
    return clearSearchDebounce;
  }, [location]);

  function clearSearchDebounce() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function resetSearchState() {
    clearSearchDebounce();
    pendingQueryRef.current = null;
    previousRequestRef.current = undefined;
    setHasSearched(false);
    setIsSearching(false);
  }

  function goToSearch(value: string) {
    const query = value.trim();
    if (!query) {
      return;
    }
    rememberSearch(query);
    navigate(`${searchRoute}?q=${encodeURIComponent(query)}`);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setIsSearchOpen(nextOpen);
        if (nextOpen) {
          resetSearchState();
        } else {
          clearSearchDebounce();
        }
      }}
    >
      <Dialog.Trigger
        asChild
        className="relative hidden size-5 items-center justify-center focus-visible:outline-hidden before:absolute before:-inset-2 xl:flex"
      >
        <button type="button" aria-label={t("accessibility.openSearch")}>
          <MagnifyingGlassIcon aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <AnimatePresence
          onExitComplete={() => {
            if (!open) {
              resetSearchState();
            }
          }}
        >
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
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="fixed inset-x-0 top-[calc(var(--height-nav)+var(--topbar-height))] z-9"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                  className="max-h-[calc(100vh-var(--height-nav)-var(--topbar-height))] w-full overflow-y-auto border-line-subtle border-t bg-(--color-header-bg) [scrollbar-gutter:stable]"
                >
                  <VisuallyHidden.Root asChild>
                    <Dialog.Title>{t("search.predictiveTitle")}</Dialog.Title>
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
                          aria-label={t("search.title")}
                          onClick={() => {
                            const value = inputRef.current?.value.trim() || "";
                            if (value) {
                              clearSearchDebounce();
                              pendingQueryRef.current = value;
                              previousRequestRef.current = searchRequest;
                              setHasSearched(true);
                              setIsSearching(true);
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

                            clearSearchDebounce();
                            pendingQueryRef.current = trimmed || null;
                            previousRequestRef.current = searchRequest;

                            if (!trimmed) {
                              setHasSearched(false);
                              setIsSearching(false);
                              fetchResults("");
                              return;
                            }

                            setIsSearching(true);
                            debounceRef.current = setTimeout(() => {
                              debounceRef.current = null;
                              setHasSearched(true);
                              setIsSearching(true);
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
                          placeholder={t("search.placeholder")}
                          ref={inputRef}
                          autoComplete="off"
                          className="h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-0 text-[#343231] text-sm shadow-none outline-none focus-visible:!border-0 focus-visible:!shadow-none"
                        />
                      </div>
                    )}
                  </PredictiveSearchForm>
                  <div className="mx-auto w-[calc(100%-4rem)] max-w-[1360px]">
                    <SearchResultsPanel loading={loading}>
                      {!(hasSearched || loading) && (
                        <div className="py-7">
                          <PopularSearch
                            className="mx-0 w-[258px] max-w-full pb-6"
                            headingClassName="flex h-7 w-full items-start gap-2 self-stretch border-[#D8D8D8] border-b"
                            itemClassName="font-normal text-sm tracking-[0.01em]"
                            useSearchHistory
                          />
                        </div>
                      )}
                      {loading && (
                        <div
                          className="flex items-center justify-center gap-2 text-body-subtle text-sm"
                          aria-live="polite"
                        >
                          <CircleNotchIcon
                            aria-hidden="true"
                            className="size-5 animate-spin"
                          />
                          <span>{t("search.searching")}</span>
                        </div>
                      )}
                      {hasSearched && !loading && <PredictiveSearchResults />}
                    </SearchResultsPanel>
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

function SearchResultsPanel({
  children,
  loading,
}: {
  children: ReactNode;
  loading: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || loading) {
      return;
    }
    const measure = () => setHeight(content.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <motion.div
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
      className="relative overflow-hidden"
      aria-busy={loading}
    >
      <div
        ref={contentRef}
        className={clsx(
          loading && "absolute inset-0 flex items-center justify-center",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

function PredictiveSearchResults() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<ResourceType>("products");
  const { results, searchTermValue } = usePredictiveSearch();
  const collectionsPath = usePrefixPathWithLocale("/collections");
  const queries = results?.find(({ type }) => type === "queries");
  const products = results?.find(({ type }) => type === "products");
  const collections = results?.find(({ type }) => type === "collections");
  const pages = results?.find(({ type }) => type === "pages");
  const collectionItems = withPinnedCollections(collections?.items, {
    allTitle: t("search.all"),
    allUrl: collectionsPath,
  });
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
        activeType === "pages" && "pb-6",
      )}
    >
      <SuggestionsPanel items={queries?.items} fallbackTerm={searchTermValue} />
      <main className={clsx("min-w-0", activeType === "pages" && "pb-6")}>
        <ResourceTabs
          activeType={activeType}
          counts={{
            products: products?.items.length || 0,
            collections: collectionItems.length,
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
              items={collectionItems.slice(0, 4)}
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
              to={`/search?q=${encodeURIComponent(searchTermValue)}`}
              className="flex h-[54px] items-center rounded-lg bg-[#F0EFED] px-6 font-semibold text-sm uppercase"
            >
              {t("search.viewAllProducts")}
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
  const { t } = useTranslation();
  return (
    <aside aria-labelledby="desktop-search-suggestions">
      <h2
        id="desktop-search-suggestions"
        className="flex h-7 items-start border-[#D8D8D8] border-b font-body font-semibold text-[14px] uppercase leading-[160%] tracking-[0.28px] text-[var(--color-text-subtle,#524B46)]"
      >
        {t("search.suggestions")}
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
  const { t } = useTranslation();
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
          {t(type === "pages" ? "search.page" : `search.${type}`)} (
          {counts[type]})
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
  const { t } = useTranslation();
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
            {t("search.products")}
          </p>
        </div>
        <p className="pt-[27px] text-[#524B46]">
          {t("search.noResults", { term: searchTerm })}
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
