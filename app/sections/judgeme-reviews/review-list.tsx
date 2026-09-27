import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { Fragment, useMemo, useState } from "react";
import { StarRating } from "~/components/star-rating";
import { useLocale } from "~/hooks/use-locale";
import { cn } from "~/utils/cn";
import type { JudgemeReviewsData } from "~/utils/judgeme";
import { formatDate } from "~/utils/locale";

const REVIEWS_PER_PAGE = 5;

function formatReviewDate(
  dateString: string,
  locale: ReturnType<typeof useLocale>,
) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return formatDate(date, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const { t } = useTranslation();
  const locale = useLocale();
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
        {t("reviews.noneYet")}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="border-line-subtle border-b">
        {reviews.map(({ id, rating, reviewer, created_at, body }) => (
          <Fragment key={id}>
            <article className="grid gap-8 border-line-subtle border-t py-12 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16 lg:flex lg:self-stretch lg:items-start lg:gap-16 lg:py-12">
              <div className="space-y-3 lg:flex lg:w-60 lg:flex-none lg:flex-col lg:items-start lg:gap-3 lg:space-y-0">
                <StarRating rating={rating} starClassName="size-4" />
                <div>
                  <p className="font-semibold leading-none tracking-[0.28px] lg:font-body lg:text-[14px] lg:text-[#343231] lg:leading-none lg:tracking-[0.28px]">
                    {reviewer.name}
                  </p>
                  <p className="break-words text-body-subtle text-sm leading-none tracking-[0.28px] lg:font-body lg:font-normal lg:text-[14px] lg:text-[#979797] lg:leading-none lg:tracking-[0.28px]">
                    {reviewer.email}
                  </p>
                </div>
              </div>
              <div className="space-y-3 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:items-start lg:gap-3 lg:space-y-0">
                <p className="break-words leading-[1.6] tracking-[0.14px] lg:self-stretch lg:font-body lg:font-normal lg:text-[14px] lg:text-[#343231] lg:leading-[1.6] lg:tracking-[0.14px]">
                  {body}
                </p>
                <time className="block text-body-subtle text-sm lg:self-stretch lg:font-body lg:font-normal lg:text-[14px] lg:text-[#979797] lg:leading-none lg:tracking-[0.28px]">
                  {formatReviewDate(created_at, locale)}
                </time>
              </div>
            </article>
          </Fragment>
        ))}
      </div>

      {pageCount > 1 && (
        <nav
          className="flex w-full self-stretch items-center justify-center gap-2 pt-10"
          aria-label={t("reviews.pages")}
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            aria-label={t("reviews.previousPage")}
            className="flex size-10 flex-col items-center justify-center rounded-lg border border-[#D8D8D8] bg-white text-[#524B46] disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-6"
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
                    "flex size-10 flex-col items-center justify-center rounded-lg border font-body text-sm leading-[100%] tracking-[0.28px]",
                    pageIndex === page
                      ? "border-[#D8D8D8] bg-[#4D4946] font-semibold text-[#F1EEEA]"
                      : "border-[#D8D8D8] bg-white text-[#343231]",
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
            aria-label={t("reviews.nextPage")}
            className="flex size-10 flex-col items-center justify-center rounded-lg border border-[#D8D8D8] bg-white text-[#524B46] disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-6"
          >
            <CaretRightIcon aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
