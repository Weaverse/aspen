import { StarIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { ProgressBar } from "~/components/progress-bar";

export function ReviewBar(review: {
  rating: number;
  count: number;
  avg: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <p className="w-2 shrink-0 text-start font-medium text-gray-900 text-sm leading-none">
        {review.rating}
      </p>
      <StarIcon className="h-4 w-4 shrink-0" />
      <ProgressBar
        className="h-1.5 w-72 max-w-80"
        indicatorClassName="h-1.5"
        value={review.avg * 100}
      />
      <div className="w-8 shrink-0 text-right font-medium text-body-700 text-sm leading-none sm:w-auto sm:text-left">
        <span className="hidden sm:inline">
          {t("reviews.count", { count: review.count })}
        </span>
        <span className="sm:hidden">{review.count}</span>
      </div>
    </div>
  );
}
