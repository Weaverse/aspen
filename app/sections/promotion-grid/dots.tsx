import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";

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

let dotVariants = cva(
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

export function Dots(props: PromotionDotsProps) {
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
      {Array.from({ length: slidesCount }, (_, index) => {
        return (
          <button
            key={index}
            type="button"
            className={clsx(
              dotVariants({
                dotsColor,
                isActive: index <= activeIndex,
              }),
            )}
            onClick={() => {
              return handleDotClick(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
