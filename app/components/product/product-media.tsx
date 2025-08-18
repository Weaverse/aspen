import {
  ArrowLeftIcon,
  ArrowRightIcon,
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
    "w-full grid justify-start gap-2 lg:gap-1",
    "lg:grid-cols-1",
    "grid-flow-col lg:grid-flow-row",
    "overflow-x-scroll scroll-px-6",
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
    showBadges = false,
    badges,
  } = props;

  // Base navigation button styling
  const baseButtonClasses = "rounded-full p-2 text-center border border-transparent transition-all duration-200 text-gray-900 bg-white hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:text-body-subtle pointer-events-auto";

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
                "object-cover w-[80vw] max-w-none lg:w-full lg:h-full",
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
    <div className="overflow-hidden product-media-slider">
      <div
        className={clsx(
          "flex items-start gap-4 [--thumbs-width:0px] overflow-hidden",
          showThumbnails && "md:[--thumbs-width:8rem]",
        )}
      >
        {showThumbnails && (
          <div
            className={clsx(
              "shrink-0 hidden md:block",
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
              className="w-full h-full overflow-visible"
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
                      "p-1 border transition-colors cursor-pointer border-transparent h-auto!",
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
                      className="object-cover w-full h-auto"
                      sizes="auto"
                    />
                    {mediaContentType === "VIDEO" && (
                      <div className="absolute bottom-2 right-2 bg-gray-900 text-white p-0.5">
                        <VideoCameraIcon className="w-4 h-4" />
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
              nextEl: navigationStyle === "corner" ? ".media_slider__next--corner" : ".media_slider__next--sides",
              prevEl: navigationStyle === "corner" ? ".media_slider__prev--corner" : ".media_slider__prev--sides",
            }}
            pagination={{ type: "fraction" }}
            modules={[Pagination, Navigation, Thumbs]}
            className="overflow-visible md:overflow-hidden pb-10 md:pb-0 md:[&_.swiper-pagination]:hidden"
            onSlideChange={(swiper) => setActiveSlide(swiper.realIndex || swiper.activeIndex)}
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
                      "absolute top-2 right-2 md:right-6 md:top-6",
                      "p-2 text-center border border-transparent rounded-full",
                      "transition-all duration-200",
                      "text-gray-900 bg-white hover:bg-gray-800 hover:text-white",
                    )}
                    onClick={() => {
                      setZoomMediaId(media.id);
                      setZoomModalOpen(true);
                    }}
                  >
                    <MagnifyingGlassPlusIcon className="w-5 h-5" />
                  </button>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Navigation Buttons */}
          <div className={clsx(
            "absolute z-[5] hidden md:flex items-center gap-2",
            {
              "bottom-6 right-6": navigationStyle === "corner",
              "inset-0 justify-between items-center pointer-events-none": navigationStyle === "sides"
            }
          )}>
            <button
              type="button"
              className={clsx(
                `media_slider__prev--${navigationStyle}`,
                baseButtonClasses,
                navigationStyle === "sides" && "ml-4"
              )}
            >
              <ArrowLeftIcon className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              className={clsx(
                `media_slider__next--${navigationStyle}`,
                baseButtonClasses,
                navigationStyle === "sides" && "mr-4"
              )}
            >
              <ArrowRightIcon className="w-4.5 h-4.5" />
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
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-[5]">
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
        className="object-cover w-full h-auto"
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
        className="w-full h-auto object-cover"
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

function ProductMediaDots({ slidesCount, activeIndex, onDotClick }: ProductMediaDotsProps) {
  if (slidesCount === 0) return null;

  // Calculate maximum width for dots container (80% of image width)
  const maxContainerWidth = 'min(320px, 80vw)';
  
  // Calculate individual dot width based on slides count
  const calculateDotWidth = (count: number) => {
    if (count <= 4) return '48px'; // w-12 equivalent
    if (count <= 6) return '32px'; // w-8 equivalent  
    if (count <= 8) return '24px'; // w-6 equivalent
    return '16px'; // w-4 equivalent for many slides
  };

  const dotWidth = calculateDotWidth(slidesCount);

  return (
    <div 
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[5] flex justify-center items-center gap-0"
      style={{ 
        maxWidth: maxContainerWidth,
        width: 'fit-content'
      }}
    >
      {Array.from({ length: slidesCount }, (_, index) => (
        <button
          key={index}
          type="button"
          className={cn(dotVariants({ 
            isActive: index <= activeIndex  // Progressive fill like before
          }))}
          style={{ 
            width: dotWidth,
            minWidth: dotWidth 
          }}
          onClick={() => onDotClick(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
