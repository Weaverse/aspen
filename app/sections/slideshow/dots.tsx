import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";

export interface SlideshowDotsProps extends VariantProps<typeof variants> {
  className?: string;
  slidesCount?: number;
}

const variants = cva(
  ["slideshow-dots", "absolute z-1 flex w-full items-center justify-center"],
  {
    variants: {
      dotsPosition: {
        top: "top-10! right-0! bottom-auto! left-0!",
        bottom: "top-auto! right-0! bottom-10! left-0!",
        left: "top-0! right-auto! bottom-0! left-5! flex-col",
        right: "top-0! right-5! bottom-0! left-auto! flex-col",
      },
      dotsColor: {
        light: "",
        dark: "",
      },
    },
    defaultVariants: {
      dotsPosition: "bottom",
      dotsColor: "light",
    },
  },
);

const dotVariants = cva(
  [
    "dot cursor-pointer",
    "h-1 w-12 p-0",
    "fade-in transition-all duration-300",
    "border-0 outline-none",
  ],
  {
    variants: {
      dotsColor: {
        light: "bg-black/30 hover:bg-black/50",
        dark: "bg-[#DBD7D1] hover:bg-[#DBD7D1]/50",
      },
      isActive: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        dotsColor: "light",
        isActive: true,
        className: "!bg-white",
      },
      {
        dotsColor: "dark",
        isActive: true,
        className: "!bg-[#A79D95]",
      },
    ],
  },
);

export function Dots(props: SlideshowDotsProps) {
  const { className, dotsPosition, dotsColor, slidesCount = 0 } = props;
  const swiper = useSwiper();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!swiper) return;

    const handleSlideChange = () => {
      const currentIndex = swiper.realIndex || swiper.activeIndex;
      setActiveIndex(currentIndex);
    };

    // Listen for slide changes
    swiper.on("slideChange", handleSlideChange);

    // Set initial active index
    handleSlideChange();

    return () => {
      swiper.off("slideChange", handleSlideChange);
    };
  }, [swiper]);

  const handleDotClick = (index: number) => {
    if (swiper) {
      swiper.slideTo(index);
    }
  };

  if (slidesCount === 0) return null;

  return (
    <div className={clsx(variants({ dotsPosition, dotsColor }), className)}>
      {Array.from({ length: slidesCount }, (_, index) => (
        <button
          key={index}
          type="button"
          className={clsx(
            dotVariants({
              dotsColor,
              isActive: index <= activeIndex,
            }),
          )}
          onClick={() => handleDotClick(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
