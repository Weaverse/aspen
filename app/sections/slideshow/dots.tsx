import { useTranslation } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import { useSwiper } from "swiper/react";
import { SegmentedProgressBar } from "~/components/progress-bar";
import { cn } from "~/utils/cn";

const containerVariants = cva(
  "mx-auto flex w-full max-w-(--page-width) px-8 md:px-(--page-padding) 2xl:px-0",
  {
    variants: {
      dotsPosition: {
        left: "justify-start",
        middle: "justify-center",
      },
    },
    defaultVariants: {
      dotsPosition: "left",
    },
  },
);

export interface SlideshowDotsProps
  extends VariantProps<typeof containerVariants> {
  className?: string;
  slidesCount?: number;
  dotsColor?: "light" | "dark";
}

export function Dots(props: SlideshowDotsProps) {
  const { t } = useTranslation();
  const { className, dotsPosition = "left", slidesCount = 0 } = props;
  const swiper = useSwiper();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const wrapper = containerRef.current
      ?.closest(".swiper")
      ?.querySelector(".swiper-wrapper");
    if (!swiper || !wrapper) {
      return;
    }

    const handleSlideChange = () => {
      const activeSlide = wrapper.querySelector(".swiper-slide-active");
      const slideIndex = activeSlide?.getAttribute("data-swiper-slide-index");
      setActiveIndex(
        slideIndex !== null && slideIndex !== undefined
          ? Number(slideIndex)
          : (swiper.realIndex ?? swiper.activeIndex),
      );
    };

    swiper.on("slideChange", handleSlideChange);
    swiper.on("realIndexChange", handleSlideChange);
    swiper.on("loopFix", handleSlideChange);
    swiper.on("transitionEnd", handleSlideChange);
    handleSlideChange();
    // Loop mode reorders slide elements after some index events have fired.
    const observer = new MutationObserver(handleSlideChange);
    observer.observe(wrapper, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-swiper-slide-index"],
      childList: true,
    });

    return () => {
      observer.disconnect();
      swiper.off("slideChange", handleSlideChange);
      swiper.off("realIndexChange", handleSlideChange);
      swiper.off("loopFix", handleSlideChange);
      swiper.off("transitionEnd", handleSlideChange);
    };
  }, [swiper]);

  const handleDotClick = (index: number) => {
    if (swiper.params.loop) {
      swiper.slideToLoop(index);
      return;
    }
    swiper.slideTo(index);
  };

  if (slidesCount === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="slideshow-dots pointer-events-none absolute inset-x-0 bottom-[73px] z-2 lg:bottom-[71px]"
    >
      <div
        className={cn(
          containerVariants({
            dotsPosition: dotsPosition === "middle" ? "middle" : "left",
          }),
          className,
        )}
      >
        <SegmentedProgressBar
          className="pointer-events-auto flex h-1 w-40"
          count={slidesCount}
          activeIndex={activeIndex}
          cumulative
          markCurrent
          segmentClassName="flex-1 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white transition-colors duration-300"
          onSegmentSelect={handleDotClick}
          getLabel={(index) => t("carousel.goToSlide", { index: index + 1 })}
        />
      </div>
    </div>
  );
}
