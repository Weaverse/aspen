import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
} from "@weaverse/hydrogen";
import { type ComponentProps, forwardRef, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { StarRating } from "~/components/star-rating";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { cn } from "~/utils/cn";

/** Marks every review block so the star rating can scroll to it. */
export const PRODUCT_REVIEWS_ATTRIBUTE = "data-product-reviews";

type JudgemeReviewsData = {
  rating: number;
  reviewNumber: number;
  error?: string;
};

function scrollToReviews() {
  const blocks = document.querySelectorAll<HTMLElement>(
    `[${PRODUCT_REVIEWS_ATTRIBUTE}]`,
  );
  // Desktop and mobile review blocks are both in the DOM; only one is laid out.
  const visible = Array.from(blocks).find((el) => el.offsetParent !== null);
  visible?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useProductReviews() {
  const { productReviews } = useLoaderData<typeof productRouteLoader>();
  const { load, data: fetchData } = useFetcher<JudgemeReviewsData>();
  const context = useParentInstance();
  const handle = context?.data?.product?.handle;
  const api = usePrefixPathWithLocale(`/api/review/${handle}`);

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable per fetcher.
  useEffect(() => {
    if (productReviews || !handle) {
      return;
    }
    load(api);
  }, [handle, api]);

  return productReviews || fetchData;
}

interface ProductRatingProps extends ComponentProps<"div"> {
  /** Render the stars as a button that scrolls to the reviews block. */
  linkToReviews?: boolean;
}

export function ProductRating({
  linkToReviews = false,
  className,
  ...rest
}: ProductRatingProps) {
  const data = useProductReviews();

  if (!data) {
    return null;
  }

  const rating = Math.round((data.rating || 0) * 100) / 100;
  const reviewNumber = data.reviewNumber || 0;
  const stars = (
    <>
      <StarRating rating={rating} />
      <span className="align-top">({reviewNumber})</span>
    </>
  );

  if (!linkToReviews) {
    return (
      <div {...rest} className={className}>
        <div className="space-x-2">{stars}</div>
      </div>
    );
  }

  return (
    <div {...rest} className={className}>
      <button
        type="button"
        onClick={scrollToReviews}
        aria-label={`Read ${reviewNumber} customer reviews`}
        className={cn(
          "space-x-2 transition-opacity hover:opacity-70",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-text)",
        )}
      >
        {stars}
      </button>
    </div>
  );
}

const JudgemeReview = forwardRef<HTMLDivElement, HydrogenComponentProps>(
  (props, ref) => <ProductRating {...props} ref={ref} />,
);

export default JudgemeReview;

export const schema = createSchema({
  type: "judgeme",
  title: "Judgeme review",
  limit: 1,
});
