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
  "M11.952 5.38005L9.48556 7.53255L10.2244 10.7372C10.2635 10.9048 10.2523 11.0801 10.1923 11.2413C10.1323 11.4026 10.0261 11.5425 9.88697 11.6437C9.74784 11.7449 9.58198 11.8028 9.41011 11.8103C9.23823 11.8177 9.06798 11.7743 8.92064 11.6855L6.12556 9.9902L3.3365 11.6855C3.18915 11.7743 3.0189 11.8177 2.84703 11.8103C2.67516 11.8028 2.50929 11.7449 2.37017 11.6437C2.23104 11.5425 2.12483 11.4026 2.06482 11.2413C2.00481 11.0801 1.99365 10.9048 2.03275 10.7372L2.77048 7.53583L0.303528 5.38005C0.173048 5.26751 0.0786977 5.11896 0.0323084 4.95302C-0.014081 4.78708 -0.0104443 4.61113 0.0427624 4.44725C0.0959692 4.28336 0.196377 4.13884 0.331396 4.03179C0.466414 3.92474 0.630032 3.85994 0.801731 3.84552L4.05345 3.56387L5.32275 0.536375C5.38903 0.377517 5.50084 0.241822 5.64408 0.146375C5.78733 0.0509294 5.95561 0 6.12775 0C6.29988 0 6.46816 0.0509294 6.61141 0.146375C6.75466 0.241822 6.86646 0.377517 6.93275 0.536375L8.20587 3.56387L11.4565 3.84552C11.6282 3.85994 11.7918 3.92474 11.9268 4.03179C12.0619 4.13884 12.1623 4.28336 12.2155 4.44725C12.2687 4.61113 12.2723 4.78708 12.2259 4.95302C12.1795 5.11896 12.0852 5.26751 11.9547 5.38005H11.952Z";

function CardStar({ state }: { state: "full" | "half" | "empty" }) {
  const clipId = useId();

  if (state === "half") {
    return (
      <svg
        width="12.258"
        height="11.811"
        viewBox="0 0 12.258 11.811"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="6.129" height="11.811" />
          </clipPath>
        </defs>
        <path d={STAR_PATH} fill="currentColor" fillOpacity={0.25} />
        <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
      </svg>
    );
  }

  return (
    <svg
      width="12.258"
      height="11.811"
      viewBox="0 0 12.258 11.811"
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
  singleStar = false,
}: {
  ratingValue?: string | null;
  ratingCountValue?: string | null;
  className?: string;
  useDotDecimal?: boolean;
  singleStar?: boolean;
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
        className="inline-flex gap-0.5 text-[var(--color-text-subtle,#524B46)]"
        role="img"
        aria-label={label}
      >
        {singleStar ? (
          <CardStar state="full" />
        ) : (
          Array.from({ length: 5 }).map((_, i) => {
            const state =
              rating >= i + 1 ? "full" : rating >= i + 0.5 ? "half" : "empty";
            return <CardStar key={i} state={state} />;
          })
        )}
      </div>
    </div>
  );
}
