import { useTranslation, type WeaverseImage } from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { useTranslatedText } from "~/hooks/use-translated-text";
import {
  DESKTOP_MIN_PX,
  minWidthQuery,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";
import { cn } from "~/utils/cn";

type StoryImage = WeaverseImage | string | null | undefined;

interface ProductStoryProps {
  heroImage?: StoryImage;
  heroImageMobile?: StoryImage;
  firstImage?: StoryImage;
  firstHeading?: string;
  secondImage?: StoryImage;
  secondHeading?: string;
  media?: Array<{
    alt?: string | null;
    previewImage?: {
      url?: string | null;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
  }>;
}

function resolveImage(
  image: StoryImage,
  fallback?: NonNullable<ProductStoryProps["media"]>[number],
  fallbackAlt = "",
) {
  if (typeof image === "string") {
    return { url: image, altText: fallbackAlt };
  }

  if (image?.url) {
    return image;
  }

  if (fallback?.previewImage?.url) {
    return {
      ...fallback.previewImage,
      altText: fallback.previewImage.altText || fallback.alt || fallbackAlt,
    };
  }

  return null;
}

function StoryMedia({
  image,
  className,
  sizes,
}: {
  image: ReturnType<typeof resolveImage>;
  className?: string;
  sizes: string;
}) {
  const { t } = useTranslation();
  if (!image) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-[#f4f4f2] text-body-subtle",
          className,
        )}
      >
        {t("product.imageUnavailable")}
      </div>
    );
  }

  return (
    <Image
      data={image}
      width={1200}
      sizes={sizes}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function ProductStory({
  heroImage,
  heroImageMobile,
  firstImage,
  firstHeading:
    rawI18nFirstHeading = "WHETHER A LAVISH VELVET SOFA, A BOLD-HUED BROCADE CHAISE.",
  secondImage,
  secondHeading:
    rawI18nSecondHeading = "TACTILE FABRIC TRENDS HAVE ALSO EXPANDED TO A BROADER UNIVERSE.",
  media = [],
}: ProductStoryProps) {
  const translateText = useTranslatedText();
  const firstHeading = translateText(
    rawI18nFirstHeading,
    "themeContent.sectionsMainProductProductStory.firstHeading",
  );
  const secondHeading = translateText(
    rawI18nSecondHeading,
    "themeContent.sectionsMainProductProductStory.secondHeading",
  );

  const { t } = useTranslation();
  const fallbackAlt = t("product.detailImage");
  const imageMedia = media.filter((item) => item.previewImage?.url);
  const resolvedHero = resolveImage(
    heroImage,
    imageMedia[1] || imageMedia[0],
    fallbackAlt,
  );
  const resolvedMobileHero = resolveImage(
    heroImageMobile || heroImage,
    imageMedia[1] || imageMedia[0],
    fallbackAlt,
  );
  const resolvedFirst = resolveImage(
    firstImage,
    imageMedia[2] || imageMedia[0],
    fallbackAlt,
  );
  const resolvedSecond = resolveImage(
    secondImage,
    imageMedia[0] || imageMedia[2],
    fallbackAlt,
  );

  if (!(resolvedHero || resolvedFirst || resolvedSecond)) {
    return null;
  }

  return (
    <div
      className="mt-10 space-y-12 px-0 md:mt-10 md:space-y-12 md:px-0 lg:mt-20 lg:px-0"
      data-product-story
    >
      <div className="aspect-square w-full self-stretch overflow-hidden rounded-xl md:aspect-[2.15/1] lg:h-[660px] lg:aspect-auto">
        <div className="h-full md:hidden">
          <StoryMedia
            image={resolvedMobileHero || resolvedHero}
            sizes="100vw"
          />
        </div>
        <div className="hidden h-full md:block">
          <StoryMedia
            image={resolvedHero}
            sizes={`${minWidthQuery(DESKTOP_MIN_PX)} 1200px, 92vw`}
          />
        </div>
      </div>

      <div className="space-y-10 md:space-y-12">
        <article className="grid items-stretch gap-0 md:grid-cols-2 md:gap-10 lg:gap-10">
          <div className="order-2 md:order-none flex min-h-[480px] items-center justify-center py-16 md:min-h-0 md:px-6 md:py-6">
            <h2 className="text-center font-heading font-normal text-[32px] uppercase leading-[1.45] tracking-normal lg:max-w-none lg:text-[32px] lg:leading-[1.45] lg:tracking-normal">
              {firstHeading}
            </h2>
          </div>
          <div className="aspect-square overflow-hidden rounded-lg lg:rounded-xl">
            <StoryMedia
              image={resolvedFirst}
              sizes={`${minWidthQuery(TABLET_MIN_PX)} 46vw, calc(100vw - 40px)`}
            />
          </div>
        </article>

        <article className="grid items-stretch gap-0 md:grid-cols-2 md:gap-10 lg:gap-10">
          <div className="aspect-square overflow-hidden rounded-lg lg:rounded-xl">
            <StoryMedia
              image={resolvedSecond}
              sizes={`${minWidthQuery(TABLET_MIN_PX)} 46vw, calc(100vw - 40px)`}
            />
          </div>
          <div className="flex min-h-[480px] items-center justify-center py-16 md:min-h-0 md:px-6 md:py-6">
            <h2 className="text-center font-heading font-normal text-[32px] uppercase leading-[1.45] tracking-normal lg:max-w-none lg:text-[32px] lg:leading-[1.45] lg:tracking-normal">
              {secondHeading}
            </h2>
          </div>
        </article>
      </div>
    </div>
  );
}
