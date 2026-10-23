import { useTranslation } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";
import { SegmentedProgressBar } from "~/components/progress-bar";

export interface PromotionDotsProps extends VariantProps<typeof variants> {
  className?: string;
  slidesCount?: number;
  dotsPosition?: "top" | "bottom" | "left" | "right";
}

let variants = cva(
  ["promotion-dots", "mt-6 flex w-full items-center justify-center"],
  {
    variants: {
      dotsColor: {
        light: "",
        dark: "",
      },
    },
    defaultVariants: {
      dotsColor: "light",
    },
  },
);

export function Dots(props: PromotionDotsProps) {
  const { t } = useTranslation();
  let { className, dotsColor, slidesCount = 0 } = props;
  let swiper = useSwiper();
  let [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!swiper) {
      return;
    }

    let handleSlideChange = () => {
      let currentIndex = swiper.realIndex || swiper.activeIndex;
      setActiveIndex(currentIndex);
    };

    swiper.on("slideChange", handleSlideChange);
    handleSlideChange();

    return () => {
      swiper.off("slideChange", handleSlideChange);
    };
  }, [swiper]);

  let handleDotClick = (index: number) => {
    if (swiper) {
      swiper.slideTo(index);
    }
  };

  if (slidesCount === 0) {
    return null;
  }

  return (
    <div className={clsx(variants({ dotsColor }), className)}>
      <SegmentedProgressBar
        className="flex min-w-0"
        count={slidesCount}
        activeIndex={activeIndex}
        cumulative
        segmentClassName="h-1 w-12 fade-in transition-all duration-300"
        onSegmentSelect={handleDotClick}
        getLabel={(index) => t("carousel.goToSlide", { index: index + 1 })}
      />
    </div>
  );
}
