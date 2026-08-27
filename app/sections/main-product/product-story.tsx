import { useTranslation, type WeaverseImage } from "@weaverse/hydrogen";
import { Image } from "~/components/image";
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
  firstHeading = "WHETHER A LAVISH VELVET SOFA, A BOLD-HUED BROCADE CHAISE.",
  secondImage,
  secondHeading = "TACTILE FABRIC TRENDS HAVE ALSO EXPANDED TO A BROADER UNIVERSE.",
  media = [],
}: ProductStoryProps) {
  const { t } = useTranslation();
  const fallbackAlt = t("product.detailImage");
  const imageMedia = media.filter((item) => item.previewImage?.url);
  const resolvedHero = resolveImage(
    heroImage,
    imageMedia[1] || imageMedia[0],
    fallbackAlt,
  );
  const resolvedMobileHero = resolveImage(
    heroImageMobile,
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
      className="mt-12 space-y-12 px-0 md:mt-16 md:space-y-12 md:px-2 lg:px-0"
      data-product-story
    >
      <div className="aspect-square overflow-hidden md:aspect-[2.15/1]">
        <div className="h-full md:hidden">
          <StoryMedia
            image={resolvedMobileHero || resolvedHero}
            sizes="100vw"
          />
        </div>
        <div className="hidden h-full md:block">
          <StoryMedia
            image={resolvedHero}
            sizes="(min-width: 1024px) 1200px, 92vw"
          />
        </div>
      </div>

      <div className="space-y-12 md:space-y-0">
        <article className="grid items-stretch md:grid-cols-2">
          <div className="order-2 flex min-h-72 items-center justify-center px-4 py-14 md:order-1 md:min-h-0 md:px-8">
            <h2 className="max-w-[15ch] text-center font-heading font-normal text-[clamp(1.75rem,4vw,2.4rem)] uppercase leading-[1.45] tracking-[-0.025em]">
              {firstHeading}
            </h2>
          </div>
          <div className="order-1 aspect-square md:order-2">
            <StoryMedia
              image={resolvedFirst}
              sizes="(min-width: 768px) 46vw, calc(100vw - 40px)"
            />
          </div>
        </article>

        <article className="grid items-stretch md:grid-cols-2">
          <div className="aspect-square">
            <StoryMedia
              image={resolvedSecond}
              sizes="(min-width: 768px) 46vw, calc(100vw - 40px)"
            />
          </div>
          <div className="flex min-h-72 items-center justify-center px-4 py-14 md:min-h-0 md:px-8">
            <h2 className="max-w-[15ch] text-center font-heading font-normal text-[clamp(1.75rem,4vw,2.4rem)] uppercase leading-[1.45] tracking-[-0.025em]">
              {secondHeading}
            </h2>
          </div>
        </article>
      </div>
    </div>
  );
}
