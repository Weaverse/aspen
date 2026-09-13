import { Image } from "@shopify/hydrogen";
import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import { forwardRef, useRef } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Image as ImageIcon,
  InstagramLogo,
} from "@phosphor-icons/react";
import type { Swiper as SwiperType } from "swiper";
import {
  DESKTOP_MIN_PX,
  minWidthQuery,
  TABLET_MIN_PX,
} from "~/utils/breakpoints";
import { useInstagramContext } from "./context";

const overlayNavButtonStyle = {
  display: "flex",
  padding: "var(--p-12, 12px)",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  borderRadius: "var(--Radius-border-radius-md, 12px)",
  background: "#FFF",
} as const;

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
    const { t } = useTranslation();
    let {
      slidesPerView,
      spaceBetween,
      showNavigation,
      arrowsColor: _arrowsColor,
      arrowsShape = "rounded-sm",
      arrowsIcon = "caret",
      children,
      ...rest
    } = props;
    const swiperRef = useRef<SwiperType | null>(null);
    const navigationStyle = {
      ...overlayNavButtonStyle,
      borderRadius: arrowsShape === "square" ? 0 : arrowsShape === "circle" ? "50%" : overlayNavButtonStyle.borderRadius,
    };
    const { loaderData } = useInstagramContext();

    const imageItemBlank = () => {
      return (
        <div className="flex aspect-square w-full items-center justify-center rounded-none bg-[#EBE8E5] md:rounded">
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
              alt={t("social.instagramPost", { index: index + 1 })}
              className="h-full w-full object-cover object-center"
              sizes={`${minWidthQuery(DESKTOP_MIN_PX)} 260px, ${minWidthQuery(TABLET_MIN_PX)} 22vw, 335px`}
            />
          ) : (
            imageItemBlank()
          )}
          <div className="instagram-tile-overlay absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
          <InstagramLogo className="instagram-tile-logo -translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-1 size-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </>
      );

      const tileClassName =
        "instagram-tile group relative mx-auto flex aspect-square w-[335px] max-w-full cursor-pointer items-start self-stretch overflow-hidden rounded-none bg-white bg-cover bg-center bg-no-repeat md:w-full md:rounded-[var(--Radius-border-radius-md,12px)]";

      if (item.username) {
        return (
          <a
            href={`https://www.instagram.com/${item.username}/`}
            target="_blank"
            rel="noreferrer"
            aria-label={t("social.instagramPostBy", {
              index: index + 1,
              username: item.username,
            })}
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
        className="instagram-slider-wrap relative w-full min-w-0 md:flex-1"
      >
        <div className="instagram-grid hidden gap-5 md:grid md:grid-cols-4">
          {displayedImages.map((item, index) => (
            <div key={`grid-${item.id || index}`} className="instagram-grid-cell">
              {renderImage(item, index)}
            </div>
          ))}
        </div>
        <div className="instagram-carousel flex w-full flex-col items-center self-stretch md:hidden">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation]}
            spaceBetween={spaceBetween}
            slidesPerView={1}
            loop={true}
            className="w-full max-w-[335px] self-stretch md:max-w-none"
          >
            {displayedImages.map((item, index) => (
              <SwiperSlide
                key={item.id || index}
                className="!flex self-stretch"
              >
                {renderImage(item, index)}
              </SwiperSlide>
            ))}
          </Swiper>

          {showNavigation && (
            <div className="mt-4 flex items-center justify-center gap-2 md:pointer-events-none md:absolute md:inset-0 md:z-10 md:mt-0 md:justify-between md:px-3">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label={t("carousel.previousSlide")}
                className="pointer-events-auto appearance-none border-0 text-[#524B46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={navigationStyle}
              >
                {arrowsIcon === "arrow" ? (
                  <ArrowLeft size={24} weight="regular" />
                ) : (
                  <CaretLeft size={24} weight="regular" />
                )}
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label={t("carousel.nextSlide")}
                className="pointer-events-auto appearance-none border-0 text-[#524B46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={navigationStyle}
              >
                {arrowsIcon === "arrow" ? (
                  <ArrowRight size={24} weight="regular" />
                ) : (
                  <CaretRight size={24} weight="regular" />
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
          defaultValue: "caret",
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
    arrowsIcon: "caret",
  },
});
