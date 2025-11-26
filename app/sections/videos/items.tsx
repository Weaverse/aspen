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
  let { gap = 16, videoAspectRatio = "3/4", children } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = Children.count(children);
  let style = {
    "--aspect-ratio": videoAspectRatio,
  } as React.CSSProperties;

  return (
    <>
      {/* Desktop view */}
      <div
        ref={ref as any}
        className="hidden md:grid md:grid-cols-2 lg:grid-cols-3"
        style={{ gap, ...style }}
      >
        {children}
      </div>

      {/* Mobile view with Swiper */}
      <div className="relative md:hidden" style={style}>
        <Swiper
          spaceBetween={gap}
          slidesPerView={1}
          modules={[Pagination]}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="w-full"
        >
          {Children.map(children, (child, index) => {
            if (isValidElement(child)) {
              return (
                <SwiperSlide key={index}>
                  {cloneElement(child, { style } as any)}
                </SwiperSlide>
              );
            }
            return <SwiperSlide key={index}>{child}</SwiperSlide>;
          })}
        </Swiper>
        <div className="mt-10 text-center font-open-sans text-[#29231E] text-sm leading-4 tracking-[0.02em]">
          {activeIndex + 1}/{totalSlides}
        </div>
      </div>
    </>
  );
});

export let schema: HydrogenComponent["schema"] = {
  type: "video--items",
  title: "Videos",
  inspector: [
    {
      group: "Videos",
      inputs: [
        {
          type: "select",
          name: "videoAspectRatio",
          label: "Video aspect ratio",
          defaultValue: "3/4",
          configs: {
            options: [
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Video (16/9)" },
            ],
          },
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          defaultValue: 16,
          configs: {
            min: 16,
            max: 40,
            step: 8,
            unit: "px",
          },
        },
      ],
    },
  ],
  childTypes: ["video--item"],
  presets: {
    aspectRatio: "3/4",
    children: [
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/cd5b45e50cc542e99b4f2d964154638a.webm",
          alt: "Video 1",
          mediaContentType: "VIDEO",
        },
        videoTitle: "Video title",
        date: "August 30, 2023",
        author: "Alexia Jacquot",
      },
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/4f8e7bc773bd49138b00903c987d528b.webm",
          alt: "Video 2",
          mediaContentType: "VIDEO",
        },
        videoTitle: "Video title",
        date: "August 30, 2023",
        author: "Alexia Jacquot",
      },
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/e63ad074b7404e84a96ceeec6cc466c5.webm",
          alt: "Video 3",
          mediaContentType: "VIDEO",
        },
        videoTitle: "Video title",
        date: "August 30, 2023",
        author: "Alexia Jacquot",
      },
    ],
  },
};

VideoItems.displayName = "VideoItems";
export default VideoItems;
