import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type React from "react";
import { useSwiper } from "swiper/react";

let variants = cva(
  [
    "block",
    "-translate-y-1/2 absolute top-1/2 z-10",
    "cursor-pointer p-3",
    "border border-transparent",
    "transition-all duration-200",
    "shadow-lg",
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
        white: [
          "text-gray-800",
          "bg-white/90",
          "border-white/90",
          "hover:bg-white",
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
        className: "-left-12 group-hover:left-2",
      },
      {
        showArrowsOnHover: false,
        side: "left",
        className: "left-2",
      },
      {
        showArrowsOnHover: true,
        side: "right",
        className: "-right-12 group-hover:right-2",
      },
      {
        showArrowsOnHover: false,
        side: "right",
        className: "right-2",
      },
    ],
  },
);

export interface PromotionArrowsProps extends VariantProps<typeof variants> {
  arrowsIcon?: "caret" | "arrow";
  iconSize?: number;
  showArrowsOnHover?: boolean;
}

export function Arrows(props: PromotionArrowsProps) {
  let {
    arrowsIcon = "caret",
    iconSize = 24,
    arrowsColor,
    showArrowsOnHover,
    arrowsShape,
  } = props;
  let swiper = useSwiper();

  let handlePrevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (swiper) {
      swiper.slidePrev();
    }
  };

  let handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (swiper) {
      swiper.slideNext();
    }
  };

  return (
    <>
      <button
        type="button"
        className={clsx(
          "promotion-arrow-prev",
          variants({
            arrowsColor,
            arrowsShape,
            showArrowsOnHover,
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
          "promotion-arrow-next",
          variants({
            arrowsColor,
            arrowsShape,
            showArrowsOnHover,
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
