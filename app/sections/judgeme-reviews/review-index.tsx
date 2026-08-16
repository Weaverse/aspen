import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, type HTMLAttributes } from "react";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import ReviewForm from "./review-form";
import { ReviewList } from "./review-list";

interface ReviewIndexProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const ReviewIndex = forwardRef<HTMLDivElement, ReviewIndexProps>(
  (props, ref) => {
    const {
      title = "Customer Reviews",
      description = "Read what our customers are saying about this product.",
      ...rest
    } = props;
    const { productReviews } = useLoaderData<typeof productRouteLoader>();

    // Check if productReviews exists before using
    if (!productReviews) {
      return null;
    }

    return (
      <div ref={ref} {...rest} className="space-y-8 md:space-y-10">
        <header className="space-y-3 text-center md:text-left">
          <h2 className="font-heading text-[clamp(2.25rem,5vw,3.2rem)] leading-tight tracking-[-0.035em]">
            {title}
          </h2>
          <p className="text-body-subtle">{description}</p>
        </header>
        <ReviewForm reviews={productReviews} />
        <ReviewList reviews={productReviews} />
      </div>
    );
  },
);

export default ReviewIndex;

export const schema = createSchema({
  type: "judgeme-review--index",
  title: "Judgeme Review",
  limit: 1,
});
