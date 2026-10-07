import { XIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";
import { cn } from "~/utils/cn";
import {
  type AppliedFilter,
  getAppliedFilterLink,
  getClearAllFiltersLink,
} from "~/utils/filter";

interface AppliedFilterTagsProps {
  filters: AppliedFilter[];
  className?: string;
}

export function AppliedFilterTags({
  filters,
  className,
}: AppliedFilterTagsProps) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const location = useLocation();

  if (!filters.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[var(--color-text-subtle,#524B46)]",
        className,
      )}
      data-applied-filter-tags
    >
      <span
        className="mr-2 shrink-0 font-body font-semibold text-[14px] leading-[22.4px] tracking-[0.28px]"
        data-filtered-by-label
      >
        {t("collection.filteredBy")}
      </span>
      {filters.map((filter) => {
        const label =
          filter.filter.price && filter.label === "Price"
            ? t("product.price")
            : filter.label;

        return (
          <Link
            aria-label={t("collection.removeFilter", { filter: label })}
            className="shrink-0 gap-2 rounded-(--radius-md) border border-line-subtle bg-transparent px-2 py-1.5 font-body font-normal text-[14px] text-[var(--color-text-subtle,#524B46)] leading-[14px] tracking-[0.28px] hover:border-line hover:bg-transparent hover:text-[var(--color-text-subtle,#524B46)]"
            key={`${filter.label}-${JSON.stringify(filter.filter)}`}
            preventScrollReset
            to={getAppliedFilterLink(filter, params, location)}
            variant="custom"
          >
            <span>{label}</span>
            <XIcon aria-hidden="true" className="size-3.5 shrink-0" />
          </Link>
        );
      })}
      <Link
        aria-label={t("collection.clearAllFilters")}
        className="ml-2 shrink-0 border-0 bg-transparent p-0 font-body font-normal text-[14px] text-[var(--color-text-subtle,#524B46)] leading-[22.4px] tracking-[0.14px] underline decoration-solid [text-decoration-skip-ink:none] [text-underline-position:from-font] hover:border-0 hover:bg-transparent hover:text-[var(--color-text-subtle,#524B46)]"
        preventScrollReset
        to={getClearAllFiltersLink(params, location)}
        variant="custom"
      >
        {t("collection.clearAll")}
      </Link>
    </div>
  );
}
