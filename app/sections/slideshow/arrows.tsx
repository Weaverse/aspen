import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import React from "react";
import { useSwiper } from "swiper/react";

const variants = cva(
  [
    "hidden md:block",
    "absolute bottom-0 -translate-y-1/2 z-1",
    "p-2 text-center cursor-pointer",
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
        true: "opacity-75 cursor-not-allowed",
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
          <ArrowLeftIcon style={{ width: iconSize, height: iconSize }} />
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
          <ArrowRightIcon style={{ width: iconSize, height: iconSize }} />
        )}
      </button>
    </>
  );
}
