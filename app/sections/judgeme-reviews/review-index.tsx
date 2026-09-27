import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, type HTMLAttributes } from "react";
import { useLoaderData } from "react-router";
import { PRODUCT_REVIEWS_ATTRIBUTE } from "~/components/product/judgeme-review";
import { useTranslatedText } from "~/hooks/use-translated-text";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import ReviewForm from "./review-form";
import { ReviewList } from "./review-list";

interface ReviewIndexProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const ReviewIndex = forwardRef<HTMLDivElement, ReviewIndexProps>(
  (props, ref) => {
    const translateText = useTranslatedText();

    const {
      title: rawI18nTitle = "Customer Reviews",
      description:
        rawI18nDescription = "Read what our customers are saying about this product.",
      ...rest
    } = props;
    const description = translateText(
      rawI18nDescription,
      "themeContent.sectionsJudgemeReviewsReviewIndex.description",
    );
    const title = translateText(
      rawI18nTitle,
      "themeContent.sectionsJudgemeReviewsReviewIndex.title",
    );
    const { productReviews } = useLoaderData<typeof productRouteLoader>();

    // Check if productReviews exists before using
    if (!productReviews) {
      return null;
    }

    return (
      <div
        ref={ref}
        {...rest}
        {...{ [PRODUCT_REVIEWS_ATTRIBUTE]: "" }}
        className="scroll-mt-[calc(var(--height-nav)+24px)] space-y-8 md:space-y-10 lg:flex lg:w-full lg:flex-col lg:items-center lg:self-stretch lg:space-y-0"
      >
        <header className="space-y-3 text-center lg:space-y-6">
          <h2 className="font-heading text-[clamp(2.25rem,5vw,3.2rem)] leading-tight tracking-[-0.035em] lg:text-[44px] lg:leading-[1.1] lg:tracking-[-1.32px]">
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
