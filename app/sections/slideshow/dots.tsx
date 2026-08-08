import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";
import { cn } from "~/utils/cn";

const variants = cva(
  [
    "slideshow-dots pointer-events-none absolute z-2",
    "flex w-full max-w-(--page-width)",
  ],
  {
    variants: {
      dotsPosition: {
        top: "inset-x-0 top-11 mx-auto justify-center px-[26px] md:top-[72px] md:justify-start md:px-(--page-padding) 2xl:px-0",
        bottom:
          "inset-x-0 bottom-11 mx-auto justify-center px-[26px] md:bottom-[71px] md:justify-start md:px-(--page-padding) 2xl:px-0",
        left: "inset-y-0 left-[26px] items-center md:left-(--page-padding)",
        right:
          "inset-y-0 right-[26px] items-center justify-end md:right-(--page-padding)",
      },
    },
    defaultVariants: {
      dotsPosition: "bottom",
    },
  },
);

const trackVariants = cva("pointer-events-auto flex", {
  variants: {
    dotsPosition: {
      top: "h-1 w-40",
      bottom: "h-1 w-40",
      left: "h-40 w-1 flex-col",
      right: "h-40 w-1 flex-col",
    },
  },
  defaultVariants: {
    dotsPosition: "bottom",
  },
});

const dotVariants = cva(
  "dot flex-1 cursor-pointer border-0 p-0 outline-none transition-colors duration-300",
  {
    variants: {
      dotsColor: {
        light: "bg-white/40 hover:bg-white/70",
        dark: "bg-white/40 hover:bg-white/70",
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
        className: "bg-white!",
      },
      {
        dotsColor: "dark",
        isActive: true,
        className: "bg-white!",
      },
    ],
  },
);

export interface SlideshowDotsProps extends VariantProps<typeof variants> {
  className?: string;
  slidesCount?: number;
  dotsColor?: "light" | "dark";
}

export function Dots(props: SlideshowDotsProps) {
  const {
    className,
    dotsPosition = "bottom",
    dotsColor = "light",
    slidesCount = 0,
  } = props;
  const swiper = useSwiper();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!swiper) {
      return;
    }

    const handleSlideChange = () => {
      setActiveIndex(swiper.realIndex || swiper.activeIndex);
    };

    swiper.on("slideChange", handleSlideChange);
    handleSlideChange();

    return () => {
      swiper.off("slideChange", handleSlideChange);
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
    <div className={cn(variants({ dotsPosition }), className)}>
      <div className={trackVariants({ dotsPosition })}>
        {Array.from({ length: slidesCount }, (_, index) => (
          <button
            key={index}
            type="button"
            className={dotVariants({
              dotsColor,
              isActive: index <= activeIndex,
            })}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
