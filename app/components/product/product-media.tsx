import {
  MagnifyingGlassPlusIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type {
  Media_MediaImage_Fragment,
  Media_Video_Fragment,
  MediaFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { FreeMode, Navigation, Pagination, Thumbs } from "swiper/modules";
import { Swiper, type SwiperClass, SwiperSlide } from "swiper/react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";
import { ZoomModal } from "./media-zoom";

const variants = cva(
  [
    "grid w-full justify-start gap-2 lg:gap-1",
    "lg:grid-cols-1",
    "grid-flow-col lg:grid-flow-row",
    "scroll-px-6 overflow-x-scroll",
    "snap-x snap-mandatory",
  ],
  {
    variants: {
      gridSize: {
        "1x1": "",
        "2x2": "2xl:grid-cols-2",
        mix: "2xl:grid-cols-2",
      },
    },
  },
);

export interface ProductMediaProps extends VariantProps<typeof variants> {
  mediaLayout: "grid" | "slider";
  imageAspectRatio: ImageAspectRatio;
  showThumbnails: boolean;
  selectedVariant: ProductVariantFragment;
  media: MediaFragment[];
  enableZoom?: boolean;
  showDots?: boolean;
  navigationStyle?: "corner" | "sides";
  arrowsColor?: "primary" | "secondary";
  arrowsShape?: "rounded-sm" | "circle" | "square";
  arrowsZoomColor?: "primary" | "secondary" | "outline";
  arrowsZoomShape?: "rounded-sm" | "circle" | "square";
  zoomColor?: "primary" | "secondary";
  zoomShape?: "rounded-sm" | "circle" | "square";
  showBadges?: boolean;
  badges?: React.ReactNode;
}

export function ProductMedia(props: ProductMediaProps) {
  const {
    mediaLayout,
    gridSize,
    showThumbnails,
    imageAspectRatio,
    selectedVariant,
    media,
    enableZoom,
    showDots = false,
    navigationStyle = "corner",
    arrowsColor = "primary",
    arrowsShape = "circle",
    arrowsZoomColor = "primary",
    arrowsZoomShape = "circle",
    zoomColor = "primary",
    zoomShape = "circle",
    showBadges = false,
    badges,
  } = props;

  // Base navigation button styling + dynamic color/shape helpers
  const colorClasses = (color: "primary" | "secondary") =>
    color === "secondary"
      ? [
          "text-(--btn-secondary-text)",
          "bg-(--btn-secondary-bg)",
          "border-(--btn-secondary-bg)",
          "hover:text-(--btn-secondary-text)",
          "hover:bg-(--btn-secondary-bg)",
          "hover:border-(--btn-secondary-bg)",
        ]
      : [
          "text-(--btn-primary-text)",
          "bg-(--btn-primary-bg)",
          "border-(--btn-primary-bg)",
          "hover:text-(--btn-primary-text)",
          "hover:bg-(--btn-primary-bg)",
          "hover:border-(--btn-primary-bg)",
        ];

  const shapeClass = (shape: "rounded-sm" | "circle" | "square") => {
    if (shape === "circle") return "rounded-full";
    if (shape === "square") return "";
    return "rounded-md"; // closest to rounded-sm in existing styles
  };

  const baseButtonClasses =
    "p-2 text-center border transition-all duration-200 pointer-events-auto";

  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [zoomMediaId, setZoomMediaId] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    if (selectedVariant && swiper) {
      const index = getSelectedVariantMediaIndex(media, selectedVariant);
      if (index !== swiper.activeIndex) {
        swiper.slideTo(index);
      }
    }
  }, [selectedVariant]);

  if (mediaLayout === "grid") {
    return (
      <div className={variants({ gridSize })}>
        {media.map((med, idx) => {
          const image = {
            ...med.previewImage,
            altText: med.alt || "Product image",
          };
          return (
            <Image
              key={med.id}
              data={image}
              loading={idx === 0 ? "eager" : "lazy"}
              width={1660}
              aspectRatio={calculateAspectRatio(image, imageAspectRatio)}
              className={clsx(
                "w-[80vw] max-w-none object-cover lg:h-full lg:w-full",
                gridSize === "mix" && idx % 3 === 0 && "lg:col-span-2",
              )}
              sizes="auto"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="product-media-slider overflow-hidden">
      <div
        className={clsx(
          "flex items-start gap-4 overflow-hidden [--thumbs-width:0px]",
          showThumbnails && "md:[--thumbs-width:8rem]",
        )}
      >
        {showThumbnails && (
          <div
            className={clsx(
              "hidden shrink-0 md:block",
              "h-[450px] w-[calc(var(--thumbs-width,0px)-1rem)]",
              "opacity-0 transition-opacity duration-300",
            )}
          >
            <Swiper
              onSwiper={setThumbsSwiper}
              direction="vertical"
              spaceBetween={8}
              slidesPerView={5}
              watchSlidesProgress
              rewind
              freeMode
              className="h-full w-full overflow-visible"
              onInit={(sw) => {
                sw.el.parentElement.style.opacity = "1";
              }}
              modules={[Navigation, Thumbs, FreeMode]}
            >
              {media.map(({ id, previewImage, alt, mediaContentType }) => {
                return (
                  <SwiperSlide
                    key={id}
                    className={cn(
                      "relative",
                      "h-auto! cursor-pointer border border-transparent p-1 transition-colors",
                      "[&.swiper-slide-thumb-active]:border-line",
                    )}
                  >
                    <Image
                      data={{
                        ...previewImage,
                        altText: alt || "Product image",
                      }}
                      loading="lazy"
                      width={200}
                      aspectRatio="1/1"
                      className="h-auto w-full object-cover"
                      sizes="auto"
                    />
                    {mediaContentType === "VIDEO" && (
                      <div className="absolute right-2 bottom-2 bg-gray-900 p-0.5 text-white">
                        <VideoCameraIcon className="h-4 w-4" />
                      </div>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
        <div className="relative w-[calc(100%-var(--thumbs-width,0px))]">
          <Swiper
            key={`media-slider-${navigationStyle}`}
            onSwiper={setSwiper}
            thumbs={{ swiper: thumbsSwiper }}
            slidesPerView={1}
            spaceBetween={4}
            autoHeight
            loop
            navigation={{
              nextEl:
                navigationStyle === "corner"
                  ? ".media_slider__next--corner"
                  : ".media_slider__next--sides",
              prevEl:
                navigationStyle === "corner"
                  ? ".media_slider__prev--corner"
                  : ".media_slider__prev--sides",
            }}
            pagination={{ type: "fraction" }}
            modules={[Pagination, Navigation, Thumbs]}
            className="overflow-visible pb-10 md:overflow-hidden md:pb-0 md:[&_.swiper-pagination]:hidden"
            onSlideChange={(swiper) =>
              setActiveSlide(swiper.realIndex || swiper.activeIndex)
            }
          >
            {media.map((media, idx) => (
              <SwiperSlide key={media.id} className="bg-gray-100">
                <Media
                  media={media}
                  imageAspectRatio={imageAspectRatio}
                  index={idx}
                />
                {enableZoom && (
                  <button
                    type="button"
                    className={clsx(
                      "absolute top-2 right-2 md:top-6 md:right-6",
                      baseButtonClasses,
                      colorClasses(zoomColor),
                      shapeClass(zoomShape),
                    )}
                    onClick={() => {
                      setZoomMediaId(media.id);
                      setZoomModalOpen(true);
                    }}
                  >
                    <MagnifyingGlassPlusIcon className="h-5 w-5" />
                  </button>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <div
            className={clsx(
              "absolute z-[5] hidden items-center gap-2 md:flex",
              {
                "right-6 bottom-6": navigationStyle === "corner",
                "pointer-events-none inset-0 items-center justify-between":
                  navigationStyle === "sides",
              },
            )}
          >
            <button
              type="button"
              className={clsx(
                `media_slider__prev--${navigationStyle}`,
                baseButtonClasses,
                colorClasses(arrowsColor),
                shapeClass(arrowsShape),
                navigationStyle === "sides" && "ml-4",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="translate-x-0.5 translate-y-0.5"
              >
                <path d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z" />
              </svg>
            </button>
            <button
              type="button"
              className={clsx(
                `media_slider__next--${navigationStyle}`,
                baseButtonClasses,
                colorClasses(arrowsColor),
                shapeClass(arrowsShape),
                navigationStyle === "sides" && "mr-4",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="translate-x-0.5 translate-y-0.5"
              >
                <path d="M11.246 3.79297L10.5389 4.50006L13.5388 7.49997H0.5V8.5H13.5387L10.5389 11.4998L11.246 12.2069L15.4531 7.99994L11.246 3.79297Z" />
              </svg>
            </button>
          </div>

          {/* Dots Navigation */}
          {showDots && (
            <ProductMediaDots
              slidesCount={media.length}
              activeIndex={activeSlide}
              onDotClick={(index) => swiper?.slideTo(index)}
            />
          )}

          {/* Badges Overlay */}
          {showBadges && badges && (
            <div className="absolute top-2.5 left-2.5 z-[1] flex items-center gap-2">
              {badges}
            </div>
          )}
        </div>
      </div>
      {enableZoom && (
        <ZoomModal
          media={media}
          zoomMediaId={zoomMediaId}
          setZoomMediaId={setZoomMediaId}
          open={zoomModalOpen}
          onOpenChange={setZoomModalOpen}
          arrowsColor={arrowsZoomColor}
          arrowsShape={arrowsZoomShape}
        />
      )}
    </div>
  );
}

function Media({
  media,
  imageAspectRatio,
  index,
}: {
  media: MediaFragment;
  imageAspectRatio: ImageAspectRatio;
  index: number;
}) {
  if (media.mediaContentType === "IMAGE") {
    const { image, alt } = media as Media_MediaImage_Fragment;
    return (
      <Image
        data={{ ...image, altText: alt || "Product image" }}
        loading={index === 0 ? "eager" : "lazy"}
        className="h-auto w-full object-cover"
        width={2048}
        aspectRatio={calculateAspectRatio(image, imageAspectRatio)}
        sizes="auto"
      />
    );
  }
  if (media.mediaContentType === "VIDEO") {
    const mediaVideo = media as Media_Video_Fragment;
    return (
      <video
        controls
        aria-label={mediaVideo.alt || "Product video"}
        className="h-auto w-full object-cover"
        style={{ aspectRatio: imageAspectRatio }}
        onError={console.error}
      >
        <track
          kind="captions"
          src={mediaVideo.sources[0].url}
          label="English"
          srcLang="en"
          default
        />
        <source src={mediaVideo.sources[0].url} type="video/mp4" />
      </video>
    );
  }
  return null;
}

function getSelectedVariantMediaIndex(
  media: MediaFragment[],
  selectedVariant: ProductVariantFragment,
) {
  if (!selectedVariant) return 0;
  const mediaUrl = selectedVariant.image?.url;
  return media.findIndex((med) => med.previewImage?.url === mediaUrl);
}

const dotVariants = cva(
  [
    "dot cursor-pointer",
    "h-0.5 p-0",
    "transition-all duration-300",
    "border-0 outline-none",
    "bg-[#DBD7D1] hover:bg-[#DBD7D1]/50",
  ],
  {
    variants: {
      isActive: {
        true: "!bg-[#A79D95]",
        false: "",
      },
    },
  },
);

interface ProductMediaDotsProps {
  slidesCount: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
}

function ProductMediaDots({
  slidesCount,
  activeIndex,
  onDotClick,
}: ProductMediaDotsProps) {
  if (slidesCount === 0) return null;

  // Calculate maximum width for dots container (80% of image width)
  const maxContainerWidth = "min(320px, 80vw)";

  // Calculate individual dot width based on slides count
  const calculateDotWidth = (count: number) => {
    if (count <= 4) return "48px"; // w-12 equivalent
    if (count <= 6) return "32px"; // w-8 equivalent
    if (count <= 8) return "24px"; // w-6 equivalent
    return "16px"; // w-4 equivalent for many slides
  };

  const dotWidth = calculateDotWidth(slidesCount);

  return (
    <div
      className="-translate-x-1/2 absolute bottom-6 left-1/2 z-[5] flex items-center justify-center gap-0"
      style={{
        maxWidth: maxContainerWidth,
        width: "fit-content",
      }}
    >
      {Array.from({ length: slidesCount }, (_, index) => (
        <button
          key={index}
          type="button"
          className={cn(
            dotVariants({
              isActive: index <= activeIndex, // Progressive fill like before
            }),
          )}
          style={{
            width: dotWidth,
            minWidth: dotWidth,
          }}
          onClick={() => onDotClick(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
