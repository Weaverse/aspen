import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { StarRating } from "~/components/star-rating";
import { cn } from "~/utils/cn";
import type { JudgemeReviewsData } from "~/utils/judgeme";

const REVIEWS_PER_PAGE = 4;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getVisiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const pages = new Set([0, pageCount - 1, currentPage]);
  if (currentPage > 0) {
    pages.add(currentPage - 1);
  }
  if (currentPage < pageCount - 1) {
    pages.add(currentPage + 1);
  }
  return [...pages].sort((a, b) => a - b);
}

export function ReviewList({
  reviews: reviewsData,
}: {
  reviews: JudgemeReviewsData;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(reviewsData.reviews.length / REVIEWS_PER_PAGE);
  const reviews = reviewsData.reviews.slice(
    page * REVIEWS_PER_PAGE,
    (page + 1) * REVIEWS_PER_PAGE,
  );
  const visiblePages = useMemo(
    () => getVisiblePages(page, pageCount),
    [page, pageCount],
  );

  if (reviewsData.reviews.length === 0) {
    return (
      <div className="border-line-subtle border-t py-12 text-center text-body-subtle">
        No reviews yet. Be the first to share your experience.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        {reviews.map(({ id, rating, reviewer, title, created_at, body }) => (
          <Fragment key={id}>
            <article className="grid gap-5 border-line-subtle border-t py-9 md:grid-cols-[34%_1fr] md:gap-10">
              <div className="space-y-3">
                <StarRating rating={rating} starClassName="size-4" />
                <div>
                  <p className="font-semibold">{reviewer.name}</p>
                  <p className="text-body-subtle text-sm">{reviewer.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                {title && <p className="font-semibold">{title}</p>}
                <p className="leading-7">{body}</p>
                <time className="block text-body-subtle text-sm">
                  {formatDate(created_at)}
                </time>
              </div>
            </article>
          </Fragment>
        ))}
      </div>

      {pageCount > 1 && (
        <nav
          className="flex items-center justify-center gap-2 pt-8"
          aria-label="Review pages"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            aria-label="Previous review page"
            className="flex size-11 items-center justify-center rounded-lg border border-line-subtle disabled:opacity-40"
          >
            <CaretLeftIcon aria-hidden="true" />
          </button>

          {visiblePages.map((pageIndex, index) => {
            const previousPage = visiblePages[index - 1];
            return (
              <Fragment key={pageIndex}>
                {previousPage !== undefined && pageIndex - previousPage > 1 && (
                  <span aria-hidden="true" className="px-1">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPage(pageIndex)}
                  aria-current={pageIndex === page ? "page" : undefined}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg border",
                    pageIndex === page
                      ? "border-body bg-body text-background"
                      : "border-line-subtle",
                  )}
                >
                  {pageIndex + 1}
                </button>
              </Fragment>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            disabled={page === pageCount - 1}
            aria-label="Next review page"
            className="flex size-11 items-center justify-center rounded-lg border border-line-subtle disabled:opacity-40"
          >
            <CaretRightIcon aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
