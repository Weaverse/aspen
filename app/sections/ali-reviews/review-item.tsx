import { SealCheckIcon, XIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { StarRating } from "~/components/star-rating";
import { useLocale } from "~/hooks/use-locale";
import { formatDate as formatLocaleDate } from "~/utils/locale";

export type AliReview = {
  id: number;
  product_id: number;
  order_id: number;
  author: string;
  country: string;
  star: number;
  content: string;
  email: string;
  media: ReviewMedia[];
  total_likes: number;
  total_dislikes: number;
  created_at: string;
  updated_at: string;
  shop_id: number;
  reply: any;
};

type ReviewMedia = {
  id: number;
  product_id: number;
  comment_id: number;
  type: string;
  url: string;
  created_at: string;
  metadata: any[];
};

export type ReviewItemData = {
  showCountry: boolean;
  showDate: boolean;
  showVerifiedBadge: boolean;
  verifiedBadgeText: string;
  showStar: boolean;
};

type ReviewItemProps = ReviewItemData & {
  review: AliReview;
};

export function ReviewItem(props: ReviewItemProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const {
    review,
    showCountry,
    showDate,
    showVerifiedBadge,
    verifiedBadgeText,
    showStar,
  } = props;
  const [previewMedia, setPreviewMedia] = useState<ReviewMedia | null>(null);

  return (
    <div className="gap-3 space-y-4 py-6">
      <div className="w-full justify-between space-y-2 md:flex">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">{review.author}</span>
            {showCountry && (
              <ReactCountryFlag
                svg
                countryCode={review.country}
                style={{ width: "24px", height: "14px" }}
                className="mb-0.5"
              />
            )}
          </div>
          {showDate && (
            <p className="font-normal text-gray-500 text-sm">
              {formatReviewDate(review.created_at, locale)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          {showVerifiedBadge && (
            <div className="inline-flex items-center gap-1">
              <SealCheckIcon className="h-4 w-4 text-white" fill="black" />
              <p className="text-xs">{verifiedBadgeText}</p>
            </div>
          )}
          {showStar && (
            <div className="flex items-center gap-0.5">
              <StarRating rating={review.star} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 min-w-0 flex-1 space-y-4 sm:mt-0">
        <p className="font-normal text-base">{review.content}</p>
        <div className="flex flex-wrap gap-3">
          {review.media.map((media) => (
            <div
              key={media.id}
              className={clsx(
                "flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden bg-gray-800",
                "outline-offset-2 hover:outline-2 hover:outline-gray-500 hover:outline-solid",
                previewMedia?.id === media.id &&
                  "outline-2 outline-gray-500 outline-solid",
              )}
              onClick={() => {
                if (previewMedia?.id === media.id) {
                  setPreviewMedia(null);
                } else {
                  setPreviewMedia(media);
                }
              }}
            >
              {/** biome-ignore lint/performance/noImgElement: <explanation> --- IGNORE --- */}
              <img
                className="h-full w-full object-cover object-center"
                src={media.url}
                alt={t("reviews.media")}
                width={80}
                height={80}
              />
            </div>
          ))}
        </div>
        <ReviewMediaPreview
          media={previewMedia}
          closePreview={() => setPreviewMedia(null)}
        />
      </div>
    </div>
  );
}

function ReviewMediaPreview(props: {
  media: ReviewMedia | null;
  closePreview: () => void;
}) {
  const { t } = useTranslation();
  const { media, closePreview } = props;
  if (media) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex h-96 w-96 items-center justify-center overflow-hidden bg-gray-800">
          {/** biome-ignore lint/performance/noImgElement: <explanation> --- IGNORE --- */}
          <img
            className="max-h-full max-w-full object-cover"
            src={media.url}
            alt={t("reviews.mediaPreview")}
            width={384}
            height={384}
          />
        </div>
        <XIcon
          className="h-5 w-5 cursor-pointer text-gray-600"
          onClick={closePreview}
        />
      </div>
    );
  }
  return null;
}

function formatReviewDate(date: string, locale: ReturnType<typeof useLocale>) {
  const dateObj = new Date(date);
  return formatLocaleDate(dateObj, locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}
