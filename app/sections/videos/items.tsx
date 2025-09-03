import type { HydrogenComponent } from "@weaverse/hydrogen";
import type { ReactNode } from "react";
import { Children, forwardRef, useState } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

interface VideoItemsProps {
  gap?: number;
  children?: ReactNode;
}

let VideoItems = forwardRef<HTMLElement, VideoItemsProps>((props, ref) => {
  let { gap = 16 } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = Children.count(props.children);

  return (
    <>
      {/* Desktop view */}
      <div
        ref={ref as any}
        className="hidden md:grid md:grid-cols-2 lg:grid-cols-3"
        style={{ gap }}
      >
        {props.children}
      </div>

      {/* Mobile view with Swiper */}
      <div className="relative md:hidden">
        <Swiper
          spaceBetween={gap}
          slidesPerView={1}
          modules={[Pagination]}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="w-full"
        >
          {Children.map(props.children, (child, index) => (
            <SwiperSlide key={index}>{child}</SwiperSlide>
          ))}
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
    children: [
      {
        type: "video--item",
        video: {
          url: "https://cdn.shopify.com/videos/c/o/v/cd5b45e50cc542e99b4f2d964154638a.webm",
          alt: "Video 1",
          mediaContentType: "VIDEO",
        },
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
        date: "August 30, 2023",
        author: "Alexia Jacquot",
      },
    ],
  },
};

VideoItems.displayName = "VideoItems";
export default VideoItems;
