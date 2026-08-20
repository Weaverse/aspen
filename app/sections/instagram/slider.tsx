import { Image } from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useRef } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import {
  CaretLeft,
  CaretRight,
  Image as ImageIcon,
  InstagramLogo,
} from "@phosphor-icons/react";
import { cva } from "class-variance-authority";
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
  arrowsIcon?: "caret" | "arrow";
}

let InstagramSlider = forwardRef<HTMLDivElement, InstagramSliderProps>(
  (props, ref) => {
    let {
      slidesPerView,
      spaceBetween,
      showNavigation,
      arrowsColor,
      arrowsShape,
      arrowsIcon = "arrow",
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
            className="!h-[50px] !w-[50px] text-[#524B46] opacity-60"
          />
        </div>
      );
    };

    const placeholderImages = [
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Guin-Round-Coffee-Table-Square-Set_1-1710403519.webp?v=1755139816",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Dawson-Queen-Size-Storage-Bed-Beach-Linen-Square-Det_2-1698291168.jpg?v=1755140106",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Swivel-Armchairs-Brilliant-White-Square-Set_1-1692867870.jpg?v=1755140064",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Sectional-Sofa-Brilliant-White-Square-Det_6-1672979175.jpg?v=1755140004",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Guin-Round-Coffee-Table-Det_1-1710403519.webp?v=1755139972",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Left-Sectional-Sofa-Brilliant-White-Square-Set_4.jpg?v=1755139930",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Hamilton-Swivel-Armchairs-Brilliant-White-Square-Set_1-1692867870.jpg?v=1755140064",
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/collections/Dawson-Queen-Size-Storage-Bed-Beach-Linen-Square-Det_2-1698291168.jpg?v=1755140106",
    ];
    const defaultInstagramData = placeholderImages.map((mediaUrl, i) => ({
      id: `default-${i}`,
      media_url: mediaUrl,
      username: "",
    }));

    let res = loaderData?.data ?? defaultInstagramData;
    let displayedImages = res?.slice(0, 8);

    const renderImage = (
      item: (typeof displayedImages)[number],
      index: number,
    ) => {
      const tile = (
        <>
          {item.media_url ? (
            <Image
              src={item.media_url}
              alt={`Instagram post ${index + 1}`}
              className="h-full w-full object-cover"
              sizes="(min-width: 1024px) 260px, calc(100vw - 40px)"
            />
          ) : (
            imageItemBlank()
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
          <InstagramLogo className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </>
      );

      const tileClassName =
        "group relative block aspect-square cursor-pointer overflow-hidden rounded-(--radius-md)";

      if (item.username) {
        return (
          <a
            href={`https://www.instagram.com/${item.username}/`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Instagram post ${index + 1} by ${item.username}`}
            className={tileClassName}
          >
            {tile}
          </a>
        );
      }

      return <div className={tileClassName}>{tile}</div>;
    };

    return (
      <div
        ref={ref}
        {...rest}
        data-legacy-slides-per-view={slidesPerView || undefined}
        className="relative w-full lg:min-w-0 lg:flex-1"
      >
        <div className="hidden gap-5 lg:grid lg:grid-cols-4">
          {displayedImages.map((item, index) => (
            <div key={`grid-${item.id || index}`}>
              {renderImage(item, index)}
            </div>
          ))}
        </div>
        <div className="lg:hidden">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation]}
            spaceBetween={spaceBetween}
            slidesPerView={1}
            loop={true}
            className="w-full"
          >
            {displayedImages.map((item, index) => (
              <SwiperSlide key={item.id || index}>
                {renderImage(item, index)}
              </SwiperSlide>
            ))}
          </Swiper>

          {showNavigation && (
            <div className="pointer-events-none z-10 mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                className={cn(arrowVariants({ arrowsColor, arrowsShape }))}
                aria-label="Previous slide"
              >
                {arrowsIcon === "caret" ? (
                  <CaretLeft size={16} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    width={16}
                    height={16}
                    fill="currentColor"
                  >
                    <path d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                className={cn(arrowVariants({ arrowsColor, arrowsShape }))}
                aria-label="Next slide"
              >
                {arrowsIcon === "caret" ? (
                  <CaretRight size={16} />
                ) : (
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
                )}
              </button>
            </div>
          )}
        </div>
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
          label: "Arrow icon",
          name: "arrowsIcon",
          configs: {
            options: [
              { value: "caret", label: "Caret" },
              { value: "arrow", label: "Arrow" },
            ],
          },
          defaultValue: "arrow",
        },
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
    spaceBetween: 20,
    showNavigation: true,
    arrowsColor: "primary",
    arrowsShape: "rounded-sm",
    arrowsIcon: "arrow",
  },
});
