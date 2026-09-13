import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useId } from "react";
import { useLocale } from "~/hooks/use-locale";
import { formatNumber } from "~/utils/locale";

type RatingValue = {
  value?: number | string;
};

function parseRating(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as RatingValue | number | string;
    const rawValue =
      typeof parsed === "object" && parsed !== null ? parsed.value : parsed;
    const rating = Number(rawValue);

    return Number.isFinite(rating) && rating > 0
      ? Math.min(5, Math.max(0, rating))
      : null;
  } catch {
    const rating = Number(value);
    return Number.isFinite(rating) && rating > 0
      ? Math.min(5, Math.max(0, rating))
      : null;
  }
}

const STAR_PATH =
  "M12.824 6.25505L10.3576 8.40755L11.0965 11.6122C11.1356 11.7798 11.1244 11.9551 11.0644 12.1163C11.0044 12.2776 10.8982 12.4175 10.759 12.5187C10.6199 12.6199 10.454 12.6778 10.2822 12.6853C10.1103 12.6927 9.94005 12.6493 9.79271 12.5605L6.99763 10.8652L4.20857 12.5605C4.06122 12.6493 3.89097 12.6927 3.7191 12.6853C3.54723 12.6778 3.38136 12.6199 3.24224 12.5187C3.10311 12.4175 2.9969 12.2776 2.93689 12.1163C2.87688 11.9551 2.86572 11.7798 2.90482 11.6122L3.64255 8.41083L1.1756 6.25505C1.04512 6.14251 0.950768 5.99396 0.904379 5.82802C0.857989 5.66208 0.861626 5.48613 0.914833 5.32225C0.968039 5.15836 1.06845 5.01384 1.20347 4.90679C1.33848 4.79974 1.5021 4.73494 1.6738 4.72052L4.92552 4.43887L6.19482 1.41138C6.2611 1.25252 6.37291 1.11682 6.51615 1.02138C6.6594 0.925929 6.82768 0.875 6.99982 0.875C7.17195 0.875 7.34023 0.925929 7.48348 1.02138C7.62673 1.11682 7.73853 1.25252 7.80482 1.41138L9.07794 4.43887L12.3286 4.72052C12.5003 4.73494 12.6639 4.79974 12.7989 4.90679C12.9339 5.01384 13.0343 5.15836 13.0875 5.32225C13.1407 5.48613 13.1444 5.66208 13.098 5.82802C13.0516 5.99396 12.9573 6.14251 12.8268 6.25505H12.824Z";

function CardStar({ state }: { state: "full" | "half" | "empty" }) {
  const clipId = useId();

  if (state === "half") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="7" height="14" />
          </clipPath>
        </defs>
        <path d={STAR_PATH} fill="currentColor" fillOpacity={0.25} />
        <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
      </svg>
    );
  }

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={STAR_PATH}
        fill="currentColor"
        fillOpacity={state === "full" ? 1 : 0.25}
      />
    </svg>
  );
}

export function ProductCardRating({
  ratingValue,
  ratingCountValue,
  className,
  useDotDecimal = false,
}: {
  ratingValue?: string | null;
  ratingCountValue?: string | null;
  className?: string;
  useDotDecimal?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocale();

  const rating = parseRating(ratingValue);

  if (rating === null) {
    return null;
  }

  const ratingCount = Number(ratingCountValue);
  const formattedRating = useDotDecimal
    ? rating.toFixed(1)
    : formatNumber(rating, locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
  const label =
    Number.isFinite(ratingCount) && ratingCount > 0
      ? t(
          ratingCount === 1
            ? "reviews.ratingWithCount"
            : "reviews.ratingWithCount_other",
          {
            rating: formattedRating,
            count: formatNumber(ratingCount, locale),
          },
        )
      : t("reviews.ratingOutOfFive", { rating: formattedRating });

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center gap-1 font-normal text-sm leading-none tracking-[0.02em]",
        className,
      )}
    >
      <span aria-hidden="true">{formattedRating}</span>
      <div
        className="inline-flex gap-0.5 text-(--color-star-rating)"
        role="img"
        aria-label={label}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const state =
            rating >= i + 1 ? "full" : rating >= i + 0.5 ? "half" : "empty";
          return <CardStar key={i} state={state} />;
        })}
      </div>
    </div>
  );
}
