import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";

export interface SlideshowDotsProps extends VariantProps<typeof variants> {
  className?: string;
}

const variants = cva(
  [
    "slideshow-dots",
    "absolute z-1 w-full flex justify-center items-center",
  ],
  {
    variants: {
      dotsPosition: {
        top: "left-0! right-0! top-10! bottom-auto!",
        bottom: "left-0! right-0! bottom-10! top-auto!",
        left: "top-0! bottom-0! flex-col left-5! right-auto!",
        right: "top-0! bottom-0! flex-col right-5! left-auto!",
      },
      dotsColor: {
        light: "[&_.dot]:bg-black [&_.active]:!bg-white",
        dark: "[&_.dot]:bg-[#DBD7D1] [&_.active]:!bg-[#A79D95]",
      },
    },
    defaultVariants: {
      dotsPosition: "bottom",
      dotsColor: "light",
    },
  },
);

export function Dots(props: SlideshowDotsProps) {
  const { className, dotsPosition, dotsColor } = props;
  return (
    <div className={clsx(variants({ dotsPosition, dotsColor }), className)} />
  );
}
