import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type React from "react";
import { useSwiper } from "swiper/react";

const variants = cva(
  [
    "hidden md:block",
    "-translate-y-1/2 absolute bottom-0 z-1",
    "cursor-pointer p-2 text-center",
    "border border-transparent",
    "transition-all duration-200",
  ],
  {
    variants: {
      arrowsColor: {
        primary: [
          "text-(--btn-primary-text)",
          "bg-(--btn-primary-bg)",
          "border-(--btn-primary-bg)",
          "hover:text-(--btn-primary-text)",
          "hover:bg-(--btn-primary-bg)",
          "hover:border-(--btn-primary-bg)",
        ],
        secondary: [
          "text-(--btn-secondary-text)",
          "bg-(--btn-secondary-bg)",
          "border-(--btn-secondary-bg)",
          "hover:text-(--btn-secondary-text)",
          "hover:bg-(--btn-secondary-bg)",
          "hover:border-(--btn-secondary-bg)",
        ],
      },
      arrowsShape: {
        square: "",
        rounded: "rounded-md",
        circle: "rounded-full",
      },
      disabled: {
        true: "cursor-not-allowed opacity-75",
        false: "",
      },
      showArrowsOnHover: { true: "", false: "" },
      side: { left: "", right: "" },
    },
    compoundVariants: [
      {
        showArrowsOnHover: true,
        side: "left",
        className: "-left-12 group-hover:left-6",
      },
      {
        showArrowsOnHover: false,
        side: "left",
        className: "left-6",
      },
      {
        showArrowsOnHover: true,
        side: "right",
        className: "-right-12 group-hover:right-6",
      },
      {
        showArrowsOnHover: false,
        side: "right",
        className: "right-6",
      },
    ],
  },
);

export interface SlideshowArrowsProps extends VariantProps<typeof variants> {
  arrowsIcon: "caret" | "arrow";
  iconSize: number;
  showArrowsOnHover: boolean;
}

export function Arrows(props: SlideshowArrowsProps) {
  const { arrowsIcon, iconSize, arrowsColor, showArrowsOnHover, arrowsShape } =
    props;
  const swiper = useSwiper();

  const handlePrevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIndex = swiper.activeIndex;
    const totalSlides = swiper.slides.length;
    if (currentIndex > 0) {
      swiper.slideTo(currentIndex - 1);
    } else {
      // Loop to last slide
      swiper.slideTo(totalSlides - 1);
    }
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIndex = swiper.activeIndex;
    const totalSlides = swiper.slides.length;
    if (currentIndex < totalSlides - 1) {
      swiper.slideTo(currentIndex + 1);
    } else {
      // Loop to first slide
      swiper.slideTo(0);
    }
  };

  return (
    <>
      <button
        type="button"
        className={clsx(
          "slideshow-arrow-prev-custom",
          variants({
            arrowsColor,
            arrowsShape,
            showArrowsOnHover,
            disabled: false,
            side: "left",
          }),
        )}
        onClick={handlePrevClick}
      >
        {arrowsIcon === "caret" ? (
          <CaretLeftIcon style={{ width: iconSize, height: iconSize }} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
          >
            <path d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={clsx(
          "slideshow-arrow-next-custom",
          variants({
            arrowsColor,
            arrowsShape,
            showArrowsOnHover,
            disabled: false,
            side: "right",
          }),
        )}
        onClick={handleNextClick}
      >
        {arrowsIcon === "caret" ? (
          <CaretRightIcon style={{ width: iconSize, height: iconSize }} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
          >
            <path
              d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z"
              transform="translate(16,0) scale(-1,1)"
            />
          </svg>
        )}
      </button>
    </>
  );
}
