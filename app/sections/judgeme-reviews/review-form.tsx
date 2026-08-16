import { StarIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Button } from "~/components/button";
import { StarRating } from "~/components/star-rating";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { cn } from "~/utils/cn";
import type { JudgemeReviewsData } from "~/utils/judgeme";

function RatingBreakdown({ reviews }: { reviews: JudgemeReviewsData }) {
  const total = reviews.reviews.length;

  return (
    <div className="w-full space-y-2 md:max-w-sm">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.reviews.filter(
          (review) => review.rating === rating,
        ).length;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div
            key={rating}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)_4.75rem] items-center gap-2 text-sm"
          >
            <span className="flex items-center gap-1">
              {rating}
              <StarIcon aria-hidden="true" className="size-3" weight="fill" />
            </span>
            <div
              className="h-2 overflow-hidden rounded-full bg-line-subtle"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-body"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-body-subtle">
              {count} review{count === 1 ? "" : "s"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ReviewForm({ reviews }: { reviews: JudgemeReviewsData }) {
  const { product } = useLoaderData<typeof productRouteLoader>();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const formId = useId();
  const fetcher = useFetcher<{ error?: string; ok?: boolean }>();
  const formRef = useRef<HTMLFormElement>(null);
  const submittedData = useRef<unknown>(null);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      submittedData.current !== fetcher.data
    ) {
      submittedData.current = fetcher.data;
      if (!fetcher.data.error) {
        setIsFormVisible(false);
        setIsSuccessVisible(true);
        setRating(0);
        setHover(0);
        formRef.current?.reset();
      }
    }
  }, [fetcher.data, fetcher.state]);

  if (!product) {
    return null;
  }

  const internalId = product.id.split("gid://shopify/Product/")[1];
  const displayRating = Number.isFinite(reviews.rating) ? reviews.rating : 0;

  return (
    <div className="w-full space-y-10">
      <div className="grid items-center gap-10 py-4 md:grid-cols-[12rem_minmax(18rem,1fr)_auto] md:gap-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <StarRating rating={displayRating} starClassName="size-7 md:size-6" />
          <p className="font-heading text-3xl">
            {displayRating.toFixed(1)} out of 5
          </p>
          <p className="text-body-subtle text-sm">
            Based on {reviews.reviewNumber} review
            {reviews.reviewNumber === 1 ? "" : "s"}
          </p>
        </div>

        <RatingBreakdown reviews={reviews} />

        <Button
          variant="primary"
          className="mx-auto min-h-14 rounded-lg px-8 md:mx-0"
          onClick={() => {
            setIsSuccessVisible(false);
            setIsFormVisible((visible) => !visible);
          }}
          aria-expanded={isFormVisible}
          aria-controls={formId}
        >
          Write a Review
        </Button>
      </div>

      {isFormVisible && (
        <fetcher.Form
          id={formId}
          ref={formRef}
          method="POST"
          encType="multipart/form-data"
          className="mx-auto max-w-2xl space-y-5 border border-line-subtle p-5 md:p-8"
        >
          <input type="hidden" name="rating" value={rating} />
          <input type="hidden" name="id" value={internalId} />

          <div>
            <p className="mb-3 font-semibold">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((ratingValue) => (
                <button
                  key={ratingValue}
                  type="button"
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${ratingValue} star${ratingValue === 1 ? "" : "s"}`}
                  aria-pressed={rating === ratingValue}
                  className="p-1"
                >
                  <StarIcon
                    className="size-6"
                    weight={
                      ratingValue <= (hover || rating) ? "fill" : "regular"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 font-semibold text-sm">
              <span>Your name</span>
              <input
                required
                type="text"
                name="name"
                className="min-h-12 w-full border border-line-subtle px-3 font-normal outline-hidden focus-visible:border-body"
              />
            </label>
            <label className="space-y-2 font-semibold text-sm">
              <span>Your email</span>
              <input
                required
                type="email"
                name="email"
                className="min-h-12 w-full border border-line-subtle px-3 font-normal outline-hidden focus-visible:border-body"
              />
            </label>
          </div>

          <label className="block space-y-2 font-semibold text-sm">
            <span>Review title</span>
            <input
              required
              type="text"
              name="title"
              className="min-h-12 w-full border border-line-subtle px-3 font-normal outline-hidden focus-visible:border-body"
            />
          </label>

          <label className="block space-y-2 font-semibold text-sm">
            <span>Your review</span>
            <textarea
              required
              name="body"
              rows={5}
              className="w-full border border-line-subtle px-3 py-3 font-normal outline-hidden focus-visible:border-body"
            />
          </label>

          {fetcher.data?.error && (
            <p role="alert" className="text-red-700 text-sm">
              {fetcher.data.error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsFormVisible(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={fetcher.state === "submitting"}
              disabled={rating === 0 || fetcher.state !== "idle"}
            >
              Submit review
            </Button>
          </div>
        </fetcher.Form>
      )}

      {isSuccessVisible && (
        <div
          role="status"
          className={cn(
            "mx-auto flex max-w-2xl items-center justify-between gap-4",
            "border border-line-subtle px-5 py-4",
          )}
        >
          <p>Thanks for leaving your review.</p>
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => setIsSuccessVisible(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewForm;
