import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type React from "react";
import { useSwiper } from "swiper/react";
import { ArrowButton } from "~/components/arrow-button";
import { cn } from "~/utils/cn";

const buttonVariants = cva(
  [
    "flex size-10 cursor-pointer items-center justify-center border lg:size-12",
    "transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
  ],
  {
    variants: {
      arrowsColor: {
        primary: [
          "border-(--btn-primary-bg) bg-(--btn-primary-bg)",
          "text-(--btn-primary-text)",
          "hover:bg-(--btn-primary-bg-hover)",
          "hover:text-(--btn-primary-text-hover)",
        ],
        secondary: [
          "border-transparent bg-[#EDEAE6] text-[#343231]",
          "hover:bg-white/80 hover:text-[#343231]",
        ],
      },
      arrowsShape: {
        square: "",
        "rounded-sm": "rounded-(--radius-md)",
        circle: "rounded-full",
      },
    },
  },
);

export interface SlideshowArrowsProps
  extends VariantProps<typeof buttonVariants> {
  arrowsIcon: "caret" | "arrow";
  iconSize: number;
  showArrowsOnHover: boolean;
}

export function Arrows(props: SlideshowArrowsProps) {
  const { t } = useTranslation();
  const { arrowsIcon, iconSize, arrowsColor, showArrowsOnHover, arrowsShape } =
    props;
  const swiper = useSwiper();

  const handlePrevClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    swiper.slidePrev();
  };

  const handleNextClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    swiper.slideNext();
  };

  const renderArrow = (direction: "left" | "right") => {
    if (arrowsIcon === "caret") {
      const Icon = direction === "left" ? CaretLeftIcon : CaretRightIcon;
      return <Icon style={{ width: iconSize, height: iconSize }} />;
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width={iconSize}
        height={iconSize}
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M4.75397 12.207L5.46106 11.4999L2.46116 8.50003L15.5 8.50003V7.5L2.46125 7.5L5.46106 4.50019L4.75397 3.7931L0.546938 8.00006L4.75397 12.207Z"
          transform={
            direction === "right" ? "translate(16,0) scale(-1,1)" : undefined
          }
        />
      </svg>
    );
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-[53px] z-2 md:bottom-[51px]",
        "transition-opacity duration-200",
        showArrowsOnHover &&
          "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
      )}
    >
      <div className="pointer-events-none mx-auto flex w-full max-w-(--page-width) justify-end gap-4 px-8 md:px-(--page-padding) 2xl:translate-x-1 2xl:px-0">
        <ArrowButton
          type="button"
          className={cn(
            "pointer-events-auto !size-10 !p-2 [&>svg]:!size-4 lg:!size-12 lg:!p-3 lg:[&>svg]:!size-5",
            buttonVariants({ arrowsColor, arrowsShape }),
          )}
          onClick={handlePrevClick}
          aria-label={t("carousel.previousSlide")}
        >
          {renderArrow("left")}
        </ArrowButton>
        <ArrowButton
          type="button"
          className={cn(
            "pointer-events-auto !size-10 !p-2 [&>svg]:!size-4 lg:!size-12 lg:!p-3 lg:[&>svg]:!size-5",
            buttonVariants({ arrowsColor, arrowsShape }),
          )}
          onClick={handleNextClick}
          aria-label={t("carousel.nextSlide")}
        >
          {renderArrow("right")}
        </ArrowButton>
      </div>
    </div>
  );
}
