import { Image } from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useRef } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Image as ImageIcon, InstagramLogo } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import type { Swiper as SwiperType } from "swiper";
import { cn } from "~/utils/cn";
import { useInstagramContext } from "./context";

const arrowVariants = cva(
  "pointer-events-auto flex h-12 w-12 items-center justify-center transition-colors",
  {
    variants: {
      arrowsColor: {
        primary: [
          "bg-(--btn-primary-bg)",
          "text-(--btn-primary-text)",
          "border-(--btn-primary-bg)",
          "hover:bg-(--btn-primary-bg)",
          "hover:text-(--btn-primary-text)",
          "hover:border-(--btn-primary-bg)",
        ],
        secondary: [
          "bg-(--btn-secondary-bg)",
          "text-(--btn-secondary-text)",
          "border-(--btn-secondary-bg)",
          "hover:bg-(--btn-secondary-bg)",
          "hover:text-(--btn-secondary-text)",
          "hover:border-(--btn-secondary-bg)",
        ],
      },
      arrowsShape: {
        "rounded-sm": "rounded",
        circle: "rounded-full",
        square: "rounded-none",
      },
    },
  },
);

interface InstagramSliderProps extends HydrogenComponentProps {
  slidesPerView: number;
  spaceBetween: number;
  showNavigation: boolean;
  arrowsColor: "primary" | "secondary";
  arrowsShape: "rounded-sm" | "circle" | "square";
}

let InstagramSlider = forwardRef<HTMLDivElement, InstagramSliderProps>(
  (props, ref) => {
    let {
      slidesPerView,
      spaceBetween,
      showNavigation,
      arrowsColor,
      arrowsShape,
      children,
      ...rest
    } = props;

    const swiperRef = useRef<SwiperType | null>(null);
    const { loaderData } = useInstagramContext();

    const imageItemBlank = () => {
      return (
        <div className="flex aspect-square w-full items-center justify-center rounded bg-[#EBE8E5]">
          <ImageIcon
            size={120}
            className="!h-[120px] !w-[120px] text-[#524B46] opacity-80"
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
        className="relative w-full space-y-10 px-0 md:space-y-0 lg:w-3/4 lg:px-7"
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
              slidesPerView,
            },
          }}
          loop={true}
          className="w-full"
        >
          {displayedImages.map((item, index) => (
            <SwiperSlide key={item.id || index}>
              <div className="group relative aspect-square cursor-pointer overflow-hidden rounded">
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
                        <span className="ff-heading font-medium text-white text-xl">
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
          <div className="md:-translate-y-1/2 pointer-events-none z-10 flex items-center justify-center gap-4 px-0 md:absolute md:top-1/2 md:right-0 md:left-0 md:justify-between md:gap-0 md:px-5 lg:px-0">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className={cn(arrowVariants({ arrowsColor, arrowsShape }))}
              aria-label="Previous slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width={16}
                height={16}
                fill="currentColor"
              >
                <path d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className={cn(arrowVariants({ arrowsColor, arrowsShape }))}
              aria-label="Next slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width={16}
                height={16}
                fill="currentColor"
              >
                <path
                  d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z"
                  transform="translate(16,0) scale(-1,1)"
                />
              </svg>
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
    {
      group: "Navigation & Controls",
      inputs: [
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "arrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "rounded-sm",
        },
      ],
    },
  ],
  presets: {
    slidesPerView: 3,
    spaceBetween: 16,
    showNavigation: true,
    arrowsColor: "primary",
    arrowsShape: "rounded-sm",
  },
});
