import { StarHalfIcon, StarIcon } from "@phosphor-icons/react";
import { cn } from "~/utils/cn";

export function StarRating({
  rating,
  label,
  className,
  starClassName,
}: {
  rating: number;
  label?: string;
  className?: string;
  starClassName?: string;
}) {
  return (
    <div
      className={cn("inline-flex gap-0.5", className)}
      role="img"
      aria-label={label || `${rating.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        if (rating >= i + 1) {
          return (
            <StarIcon
              aria-hidden="true"
              weight="fill"
              className={cn("size-4", starClassName)}
              key={i}
            />
          );
        }
        if (rating >= i + 0.5) {
          return (
            <StarHalfIcon
              aria-hidden="true"
              weight="fill"
              className={cn("size-4", starClassName)}
              key={i}
            />
          );
        }
        return (
          <StarIcon
            aria-hidden="true"
            className={cn("size-4", starClassName)}
            key={i}
          />
        );
      })}
    </div>
  );
}
