import { CircleNotchIcon, MagnifyingGlass, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Link from "~/components/link";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { PopularSearch } from "../PopularSearch";
import { PredictiveSearchForm } from "../search-form";
import { PredictiveSearchResult } from "./predictive-search-result";

export function PredictiveSearchButtonMobile({ setIsSearchOpen }) {
  const { t } = useTranslation();
  const searchRoute = usePrefixPathWithLocale("/search");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the dialog after navigation
  useEffect(() => {
    setOpen(false);
    setIsSearchOpen(false);
    resetSearchState();
  }, [location]);

  function resetSearchState() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setSearchQuery("");
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
        if (!nextOpen) {
          resetSearchState();
        }
      }}
    >
      <Dialog.Trigger
        asChild
        className="relative flex size-5 items-center justify-center focus-visible:outline-none before:absolute before:-inset-2 xl:hidden"
      >
        <button type="button" aria-label={t("accessibility.openSearch")}>
          <MagnifyingGlass aria-hidden="true" className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay forceMount>
                <motion.div
                  className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="fixed inset-y-0 left-0 z-10"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                  className="flex h-full w-screen max-w-[381px] flex-col overflow-hidden rounded-r-2xl bg-(--color-header-bg)"
                >
                  <VisuallyHidden.Root asChild>
                    <Dialog.Title>{t("search.predictiveTitle")}</Dialog.Title>
                  </VisuallyHidden.Root>
                  <div className="flex h-[54px] shrink-0 items-center justify-between px-5">
                    <span className="font-semibold text-sm uppercase">
                      {t("search.title")}
                    </span>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="-mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body"
                        aria-label={t("accessibility.closeSearch")}
                      >
                        <X aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <PredictiveSearchForm className="flex min-h-0 flex-1 flex-col">
                    {({ fetchResults, inputRef, fetcher }) => {
                      const loading = isSearching || fetcher.state !== "idle";

                      return (
                        <>
                          <div className="mx-5 flex h-[65px] items-center gap-3 border-[#9D9D9D] border-b">
                            <button
                              type="button"
                              className="flex h-12 w-7 shrink-0 items-center justify-start"
                              aria-label={t("accessibility.viewSearchResults")}
                              onClick={() => goToSearch(searchQuery)}
                            >
                              <MagnifyingGlass
                                aria-hidden="true"
                                className="h-5 w-5"
                              />
                            </button>
                            <input
                              name="q"
                              type="search"
                              value={searchQuery}
                              onChange={(event) => {
                                const value = event.target.value;
                                const trimmed = value.trim();
                                setSearchQuery(value);
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
                                  goToSearch(searchQuery);
                                }
                              }}
                              placeholder={t("search.placeholder")}
                              ref={inputRef}
                              autoComplete="off"
                              className="h-12 min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-0 text-sm shadow-none outline-none focus-visible:!border-0 focus-visible:!shadow-none"
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                className="flex h-12 w-8 shrink-0 items-center justify-end text-body-subtle"
                                aria-label={t("accessibility.clearSearch")}
                                onClick={() => {
                                  if (debounceRef.current) {
                                    clearTimeout(debounceRef.current);
                                  }
                                  setSearchQuery("");
                                  setHasSearched(false);
                                  setIsSearching(false);
                                  fetchResults("");
                                  inputRef.current?.focus();
                                }}
                              >
                                <X aria-hidden="true" className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-10">
                            {!hasSearched && !loading ? (
                              <PopularSearch />
                            ) : loading ? (
                              <div
                                className="flex min-h-48 items-center justify-center gap-2 text-body-subtle"
                                aria-live="polite"
                              >
                                <CircleNotchIcon
                                  aria-hidden="true"
                                  className="h-5 w-5 animate-spin"
                                />
                                <span>{t("search.searching")}</span>
                              </div>
                            ) : (
                              <PredictiveSearchResults />
                            )}
                          </div>
                        </>
                      );
                    }}
                  </PredictiveSearchForm>
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
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<
    "products" | "collections" | "pages"
  >("products");
  const { results, searchTerm, searchTermValue } = usePredictiveSearch();
  const queries = results?.find(({ type }) => type === "queries");
  const products = results?.find(({ type }) => type === "products");
  const collections = results?.find(({ type }) => type === "collections");
  const pages = results?.find(({ type }) => type === "pages");
  const hasResourceResults = Boolean(
    products?.items.length || collections?.items.length || pages?.items.length,
  );

  if (!hasResourceResults) {
    return <NoResults searchTerm={searchTermValue} />;
  }

  return (
    <div className="w-full">
      <PredictiveSearchResult type="queries" items={queries?.items} />
      <div className="mt-4">
        <div className="relative grid grid-cols-[116px_139px_1fr] border-[#D8D8D8] border-b">
          {(["products", "collections", "pages"] as const).map((type) => {
            const label = t(
              type === "pages" ? "search.page" : `search.${type}`,
            );
            return (
              <button
                key={type}
                type="button"
                className={clsx(
                  "relative pb-[11px] text-left font-semibold text-sm uppercase outline-none transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#343231] focus-visible:outline-offset-2",
                  activeType === type
                    ? clsx(
                        "text-[#343231] after:absolute after:bottom-0 after:h-px after:translate-y-px after:bg-[#9D9D9D]",
                        type === "products" && "after:left-0 after:w-[76px]",
                        type === "collections" && "after:left-0 after:w-[99px]",
                        type === "pages" && "after:left-5 after:w-[37px]",
                      )
                    : "text-[#979797]",
                )}
                onClick={() => setActiveType(type)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="pt-5">
          {activeType === "pages" && (
            <PredictiveSearchResult type="pages" items={pages?.items} />
          )}
          {activeType === "collections" && (
            <PredictiveSearchResult
              type="collections"
              items={collections?.items}
            />
          )}
          {activeType === "products" && (
            <PredictiveSearchResult
              type="products"
              items={products?.items.slice(0, 5)}
            />
          )}
        </div>
        {activeType === "products" && products?.items.length > 0 && (
          <div className="mt-9">
            <Link
              to={`/search?q=${encodeURIComponent(searchTerm.current)}`}
              className="flex h-[54px] w-fit items-center rounded-md bg-[#F0EFED] px-6 font-semibold text-sm uppercase"
            >
              {t("search.viewAllProducts")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function NoResults({ searchTerm }: { searchTerm: string }) {
  const { t } = useTranslation();
  if (!searchTerm) {
    return null;
  }

  return (
    <div
      className="w-full text-left text-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="border-[#D8D8D8] border-b pb-[11px] font-semibold uppercase">
        {t("search.suggestions")}
      </p>
      <p className="py-[22px] font-semibold">{searchTerm}</p>
      <div className="border-[#D8D8D8] border-b">
        <p className="w-[76px] border-[#9D9D9D] border-b pb-[11px] font-semibold uppercase">
          {t("search.products")}
        </p>
      </div>
      <p className="pt-5">{t("search.noResults", { term: searchTerm })}</p>
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
