import type { HydrogenComponent } from "@weaverse/hydrogen";
import type { ReactNode } from "react";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useState,
} from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import type { ImageAspectRatio } from "~/types/image";

interface VideoItemsProps {
  gap?: number;
  videoAspectRatio?: ImageAspectRatio;
  children?: ReactNode;
}

let VideoItems = forwardRef<HTMLElement, VideoItemsProps>((props, ref) => {
  let { gap = 20, videoAspectRatio = "9/16", children } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const sourceItems = Children.toArray(children).slice(0, 4);
  // The approved composition is a four-card reel. Older saved projects often
  // contain only the original three children, so reuse the second reel as the
  // fourth visual (the Figma scenario intentionally repeats that texture).
  const items =
    sourceItems.length === 3 && isValidElement(sourceItems[1])
      ? [
          ...sourceItems,
          cloneElement(sourceItems[1], { key: "video-design-fourth" } as any),
        ]
      : sourceItems;
  const totalSlides = items.length;
  let style = {
    "--aspect-ratio": videoAspectRatio,
    "--video-items-gap": `${gap}px`,
  } as React.CSSProperties;

  return (
    <>
      <div
        ref={ref as any}
        className="hidden w-full grid-cols-4 lg:grid"
        style={{ gap: "var(--video-items-gap)", ...style }}
      >
        {items}
      </div>

      <div className="relative lg:hidden" style={style}>
        <Swiper
          spaceBetween={gap}
          slidesPerView="auto"
          modules={[Pagination]}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          className="w-full"
        >
          {Children.map(items, (child, index) => {
            if (isValidElement(child)) {
              return (
                <SwiperSlide key={index} className="!w-[325px] max-w-full">
                  {cloneElement(child, {
                    style,
                  } as any)}
                </SwiperSlide>
              );
            }
            return (
              <SwiperSlide key={index} className="!w-[325px] max-w-full">
                {child}
              </SwiperSlide>
            );
          })}
        </Swiper>
        {totalSlides > 1 && (
          <div
            className="mt-10 text-center font-body text-(--color-text) text-xs leading-4"
            aria-live="polite"
          >
            {activeIndex + 1}/{totalSlides}
          </div>
        )}
      </div>
    </>
  );
});

export let schema: HydrogenComponent["schema"] = {
  type: "video--items",
  title: "Videos",
  settings: [
    {
      group: "Videos",
      inputs: [
        {
          type: "select",
          name: "videoAspectRatio",
          label: "Video aspect ratio",
          defaultValue: "9/16",
          configs: {
            options: [
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Video (16/9)" },
              { value: "9/16", label: "Reel videos (9/16)" },
            ],
          },
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          defaultValue: 20,
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
  childTypes: ["video--item"],
  presets: {
    videoAspectRatio: "9/16",
    gap: 20,
    children: [
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/cd5b45e50cc542e99b4f2d964154638a.webm",
          alt: "Video 1",
          mediaContentType: "VIDEO",
        },
        addToCartText: "Add to Cart",
      },
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/4f8e7bc773bd49138b00903c987d528b.webm",
          alt: "Video 2",
          mediaContentType: "VIDEO",
        },
        addToCartText: "Add to Cart",
      },
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/e63ad074b7404e84a96ceeec6cc466c5.webm",
          alt: "Video 3",
          mediaContentType: "VIDEO",
        },
        addToCartText: "Add to Cart",
      },
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/4f8e7bc773bd49138b00903c987d528b.webm",
          alt: "Video 4",
          mediaContentType: "VIDEO",
        },
        addToCartText: "Add to Cart",
      },
    ],
  },
};

VideoItems.displayName = "VideoItems";
export default VideoItems;
