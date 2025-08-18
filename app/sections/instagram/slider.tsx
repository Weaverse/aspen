import { Image } from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import {
  Image as ImageIcon,
  InstagramLogo,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Swiper as SwiperType } from "swiper";
import { useInstagramContext } from "./context";

interface InstagramSliderProps extends HydrogenComponentProps {
  slidesPerView: number;
  spaceBetween: number;
  showNavigation: boolean;
}

let InstagramSlider = forwardRef<HTMLDivElement, InstagramSliderProps>(
  (props, ref) => {
    let { slidesPerView, spaceBetween, showNavigation, children, ...rest } =
      props;

    const swiperRef = useRef<SwiperType | null>(null);
    const { loaderData } = useInstagramContext();

    const imageItemBlank = () => {
      return (
        <div className="flex aspect-square w-full items-center justify-center bg-[#EBE8E5] rounded">
          <ImageIcon
            size={120}
            className="!h-[120px] !w-[120px] opacity-80 text-[#524B46]"
          />
        </div>
      );
    };

    const defaultInstagramData = Array.from({ length: 6 }).map((_, i) => ({
      id: `default-${i}`,
      media_url: "",
      username: "",
    }));

    let res = loaderData?.data ?? defaultInstagramData;
    let displayedImages = res?.slice(0, 6);

    return (
      <div
        ref={ref}
        {...rest}
        className="relative lg:w-3/4 w-full space-y-10 md:space-y-0"
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          modules={[Navigation]}
          spaceBetween={spaceBetween}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: slidesPerView >= 2 ? 2 : 1,
            },
            768: {
              slidesPerView: slidesPerView >= 3 ? 3 : slidesPerView,
            },
            1024: {
              slidesPerView: slidesPerView,
            },
          }}
          loop={true}
          className="w-full"
        >
          {displayedImages.map((item, index) => (
            <SwiperSlide key={item.id || index}>
              <div className="group relative aspect-square cursor-pointer rounded overflow-hidden">
                {item.media_url ? (
                  <Image
                    src={item.media_url}
                    className="aspect-square w-full object-cover"
                    sizes="(min-width: 1024px) 320px, (min-width: 768px) 250px, (min-width: 640px) 200px, 300px"
                  />
                ) : (
                  imageItemBlank()
                )}
                {item.username && (
                  <>
                    <div className="absolute inset-0 z-10 hidden items-center justify-center group-hover:flex">
                      <a
                        href={`https://www.instagram.com/${item.username}/`}
                        target="_blank"
                        className="flex items-center justify-center gap-2"
                        rel="noreferrer"
                      >
                        <InstagramLogo className="h-7 w-7 text-white" />
                        <span className="ff-heading text-xl font-medium text-white">
                          {item.username}
                        </span>
                      </a>
                    </div>
                    <div className="absolute inset-0 opacity-0 transition-colors duration-500 group-hover:bg-[#554612] group-hover:opacity-50" />
                  </>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {showNavigation && (
          <div className="md:absolute md:top-1/2 md:left-0 md:right-0 flex md:justify-between justify-center md:gap-0 gap-4 items-center pointer-events-none z-10 px-0 md:px-5 lg:px-0">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full hover:bg-white/80 transition-colors"
              aria-label="Previous slide"
            >
              <ArrowLeft size={16} className="text-[#29231E]" />
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full hover:bg-white/80 transition-colors"
              aria-label="Next slide"
            >
              <ArrowRight size={16} className="text-[#29231E]" />
            </button>
          </div>
        )}
        {children}
      </div>
    );
  },
);

export default InstagramSlider;

export let schema = createSchema({
  type: "instagram--slider",
  title: "Image Slider",
  limit: 1,
  settings: [
    {
      group: "Slider Settings",
      inputs: [
        {
          type: "range",
          name: "slidesPerView",
          label: "Slides per view (desktop)",
          defaultValue: 3,
          configs: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        {
          type: "range",
          name: "spaceBetween",
          label: "Space between slides",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
        },
        {
          type: "switch",
          name: "showNavigation",
          label: "Show navigation arrows",
          defaultValue: true,
        },
      ],
    },
  ],
  presets: {
    slidesPerView: 3,
    spaceBetween: 16,
    showNavigation: true,
  },
});
