import clsx from "clsx";
import { StarRating } from "~/components/star-rating";

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

export function ProductCardRating({
  ratingValue,
  ratingCountValue,
  className,
}: {
  ratingValue?: string | null;
  ratingCountValue?: string | null;
  className?: string;
}) {
  const rating = parseRating(ratingValue);

  if (rating === null) {
    return null;
  }

  const ratingCount = Number(ratingCountValue);
  const formattedRating = rating.toFixed(1);
  const label =
    Number.isFinite(ratingCount) && ratingCount > 0
      ? `${formattedRating} out of 5 from ${ratingCount} ratings`
      : `${formattedRating} out of 5`;

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center gap-1 text-xs leading-none",
        className,
      )}
      style={{ color: "var(--color-star-rating)" }}
    >
      <span aria-hidden="true">{formattedRating}</span>
      <StarRating
        rating={rating}
        label={label}
        className="gap-px"
        starClassName="size-3"
      />
    </div>
  );
}
