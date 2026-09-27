import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useMemo, useState } from "react";
import Link from "~/components/link";
import { cn } from "~/utils/cn";

type PopularSearchProps = {
  className?: string;
  headingClassName?: string;
  itemClassName?: string;
  useSearchHistory?: boolean;
};

export function PopularSearch({
  className,
  headingClassName,
  itemClassName,
  useSearchHistory = false,
}: PopularSearchProps) {
  const { t } = useTranslation();
  const defaultSearches = useMemo(
    () => [
      t("search.popularTerms.chair"),
      t("search.popularTerms.barrelChair"),
      t("search.popularTerms.accentChair"),
      t("search.popularTerms.swivelChair"),
      t("search.popularTerms.diningChair"),
    ],
    [t],
  );
  const [topSearches, setTopSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!useSearchHistory) {
      return;
    }

    try {
      const raw = localStorage.getItem("searchHistory");
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const counts = new Map<string, number>();
        for (const term of parsed) {
          const search = String(term || "").trim();
          if (!search) {
            continue;
          }
          counts.set(search, (counts.get(search) || 0) + 1);
        }
        const sorted = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([search]) => search)
          .slice(0, 5);
        setTopSearches(sorted);
      }
    } catch {
      // Ignore invalid or unavailable search history.
    }
  }, [useSearchHistory]);

  const displaySearches = useMemo(() => {
    if (useSearchHistory && topSearches.length > 0) {
      return topSearches;
    }
    return defaultSearches;
  }, [topSearches, useSearchHistory, defaultSearches]);

  return (
    <div
      className={cn(
        "mx-auto flex max-w-(--page-width) flex-col gap-4",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold text-xs uppercase tracking-[0.02em]",
          headingClassName,
        )}
      >
        {t("search.popular")}
      </span>
      <ul className="flex flex-col gap-2">
        {displaySearches.map((search) => (
          <li key={search}>
            <Link
              to={`/search?q=${encodeURIComponent(search)}`}
              className="hover:-translate-y-1 block w-fit font-normal transition-transform duration-200"
            >
              <span className={cn("font-normal", itemClassName)}>{search}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
