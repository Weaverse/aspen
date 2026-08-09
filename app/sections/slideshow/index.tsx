import {
  createSchema,
  type HydrogenComponentProps,
  useThemeSettings,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SlideshowArrowsProps } from "./arrows";
import { Arrows } from "./arrows";
import type { SlideshowDotsProps } from "./dots";
import { Dots } from "./dots";

const variants = cva("group [&_.swiper]:h-full", {
  variants: {
    height: {
      small: "h-[440px] lg:h-[540px]",
      medium: "h-[560px] lg:h-[660px]",
      large: "h-[667px] lg:h-[840px]",
      full: "",
    },
    enableTransparentHeader: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      height: "full",
      enableTransparentHeader: true,
      className: "h-screen-no-topbar",
    },
    {
      height: "full",
      enableTransparentHeader: false,
      className: "h-screen-dynamic",
    },
  ],
  defaultVariants: {
    height: "large",
  },
});

export interface SlideshowData
  extends VariantProps<typeof variants>,
    SlideshowArrowsProps,
    SlideshowDotsProps {
  effect?: "fade" | "slide";
  showArrows: boolean;
  showDots: boolean;
  dotsPosition: "top" | "bottom" | "left" | "right";
  dotsColor: "light" | "dark";
  loop: boolean;
  autoRotate: boolean;
  changeSlidesEvery: number;
}

const Slideshow = forwardRef<
  HTMLDivElement,
  SlideshowData & HydrogenComponentProps
>((props, ref) => {
  const {
    height,
    effect,
    showArrows,
    arrowsIcon,
    iconSize,
    showArrowsOnHover,
    arrowsColor,
    arrowsShape,
    showDots = true,
    dotsPosition,
    dotsColor,
    loop,
    autoRotate,
    changeSlidesEvery,
    children = [],
    ...rest
  } = props;
  const { enableTransparentHeader } = useThemeSettings();

  return (
    <section
      key={Object.values(props)
        .filter((v) => typeof v !== "object")
        .join("-")}
      ref={ref}
      {...rest}
      className={variants({ height, enableTransparentHeader })}
    >
      <Swiper
        effect={effect}
        fadeEffect={{
          crossFade: true,
        }}
        loop={loop}
        autoplay={autoRotate ? { delay: changeSlidesEvery * 1000 } : false}
        modules={[
          effect === "fade" ? EffectFade : null,
          autoRotate ? Autoplay : null,
        ].filter(Boolean)}
      >
        {children.map((child, idx) => (
          <SwiperSlide key={idx}>{child}</SwiperSlide>
        ))}
        {showArrows && <Arrows {...props} />}
        {showDots && <Dots {...props} slidesCount={children.length} />}
      </Swiper>
    </section>
  );
});

export default Slideshow;

export const schema = createSchema({
  title: "Slideshow",
  type: "slideshow",
  childTypes: ["slideshow-slide"],
  settings: [
    {
      group: "Slideshow",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
            ],
          },
          defaultValue: "large",
        },
        {
          type: "toggle-group",
          label: "Slide effect",
          name: "effect",
          configs: {
            options: [
              { value: "fade", label: "Fade" },
              { value: "slide", label: "Slide" },
            ],
          },
          defaultValue: "fade",
        },
        {
          type: "switch",
          label: "Auto-rotate slides",
          name: "autoRotate",
          defaultValue: false,
        },
        {
          type: "range",
          label: "Change slides every",
          name: "changeSlidesEvery",
          configs: {
            min: 3,
            max: 9,
            step: 1,
            unit: "s",
          },
          defaultValue: 5,
          condition: (data: SlideshowData) => data.autoRotate,
          helpText: "Auto-rotate is disabled inside Weaverse Studio.",
        },
        {
          type: "switch",
          label: "Loop",
          name: "loop",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Navigation & Controls",
      inputs: [
        {
          type: "heading",
          label: "Arrows",
        },
        {
          type: "switch",
          label: "Show arrows",
          name: "showArrows",
          defaultValue: false,
        },
        {
          type: "select",
          label: "Arrow icon",
          name: "arrowsIcon",
          configs: {
            options: [
              { value: "caret", label: "Caret" },
              { value: "arrow", label: "Arrow" },
            ],
          },
          defaultValue: "caret",
          condition: (data: SlideshowData) => data.showArrows,
        },
        {
          type: "range",
          label: "Icon size",
          name: "iconSize",
          configs: {
            min: 16,
            max: 40,
            step: 2,
          },
          defaultValue: 20,
          condition: (data: SlideshowData) => data.showArrows,
        },
        {
          type: "switch",
          label: "Show arrows on hover",
          name: "showArrowsOnHover",
          defaultValue: true,
          condition: (data: SlideshowData) => data.showArrows,
        },
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
          condition: (data: SlideshowData) => data.showArrows,
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "arrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "rounded-sm",
          condition: (data: SlideshowData) => data.showArrows,
        },

        {
          type: "heading",
          label: "Dots",
        },
        {
          type: "switch",
          label: "Show dots",
          name: "showDots",
          defaultValue: true,
        },
        {
          type: "select",
          label: "Dots position",
          name: "dotsPosition",
          configs: {
            options: [
              { value: "top", label: "Top" },
              { value: "bottom", label: "Bottom" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ],
          },
          defaultValue: "bottom",
          condition: (data: SlideshowData) => data.showDots,
        },
        {
          type: "select",
          label: "Dots color",
          name: "dotsColor",
          configs: {
            options: [
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ],
          },
          defaultValue: "light",
          condition: (data: SlideshowData) => data.showDots,
        },
      ],
    },
  ],
  presets: {
    height: "large",
    effect: "fade",
    autoRotate: false,
    changeSlidesEvery: 5,
    loop: true,
    showArrows: true,
    arrowsIcon: "caret",
    iconSize: 20,
    showArrowsOnHover: false,
    arrowsColor: "secondary",
    arrowsShape: "rounded-sm",
    showDots: true,
    dotsPosition: "bottom",
    dotsColor: "light",
    children: [
      {
        type: "slideshow-slide",
        width: "fixed",
        verticalPadding: "large",
        contentPosition: "bottom left",
        gap: 24,
        backgroundFit: "cover",
        backgroundPosition: "center center",
        mobileBackgroundPosition: "center center",
        enableOverlay: true,
        overlayColor: "#1B1B19",
        overlayOpacity: 30,
        headingContent: "THE CRAFTED COMFORT",
        mobileHeadingContent: "THE TAILORED ELEGANCE",
        headingTagName: "h1",
        color: "#FEF4EB",
        size: "default",
        weight: "400",
        letterSpacing: "normal",
        alignment: "left",
        paragraphContent:
          "Handcrafted pieces designed to bring warmth, character, and lasting quality to every room.",
        mobileParagraphContent:
          "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
        paragraphColor: "#FEF4EB",
        paragraphSize: "base",
        paragraphAlignment: "left",
        paragraphWidth: "full",
        buttonContent: "EXPLORE MORE",
        mobileButtonContent: "EXPLORE NOW",
        mobileButtonVariant: "decor",
        to: "/collections",
        variant: "custom",
        textColor: "#FEF4EB",
        backgroundColor: "#00000000",
        borderColor: "#FEF4EB",
        textColorHover: "#29231E",
        backgroundColorHover: "#FEF4EB",
        borderColorHover: "#FEF4EB",
        textColorDecor: "#FEF4EB",
      },
      {
        type: "slideshow-slide",
        width: "fixed",
        verticalPadding: "large",
        contentPosition: "bottom left",
        gap: 24,
        backgroundFit: "cover",
        backgroundPosition: "center center",
        mobileBackgroundPosition: "center center",
        enableOverlay: true,
        overlayColor: "#1B1B19",
        overlayOpacity: 30,
        headingContent: "THE TAILORED ELEGANCE",
        mobileHeadingContent: "THE CRAFTED COMFORT",
        headingTagName: "h1",
        color: "#FEF4EB",
        size: "default",
        weight: "400",
        letterSpacing: "normal",
        alignment: "left",
        paragraphContent:
          "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
        mobileParagraphContent:
          "Handcrafted pieces designed to bring warmth, character, and lasting quality to every room.",
        paragraphColor: "#FEF4EB",
        paragraphSize: "base",
        paragraphAlignment: "left",
        paragraphWidth: "full",
        buttonContent: "EXPLORE MORE",
        mobileButtonContent: "EXPLORE NOW",
        mobileButtonVariant: "decor",
        to: "/collections",
        variant: "custom",
        textColor: "#FEF4EB",
        backgroundColor: "#00000000",
        borderColor: "#FEF4EB",
        textColorHover: "#29231E",
        backgroundColorHover: "#FEF4EB",
        borderColorHover: "#FEF4EB",
        textColorDecor: "#FEF4EB",
      },
      {
        type: "slideshow-slide",
        width: "fixed",
        verticalPadding: "large",
        contentPosition: "bottom left",
        gap: 24,
        backgroundFit: "cover",
        backgroundPosition: "center center",
        mobileBackgroundPosition: "center center",
        enableOverlay: true,
        overlayColor: "#1B1B19",
        overlayOpacity: 30,
        headingContent: "TIMELESS BY DESIGN",
        mobileHeadingContent: "COMFORT, CONSIDERED",
        headingTagName: "h1",
        color: "#FEF4EB",
        size: "default",
        weight: "400",
        letterSpacing: "normal",
        alignment: "left",
        paragraphContent:
          "Enduring silhouettes and honest materials, thoughtfully made for everyday living.",
        mobileParagraphContent:
          "Thoughtful proportions and tactile materials bring ease to every room.",
        paragraphColor: "#FEF4EB",
        paragraphSize: "base",
        paragraphAlignment: "left",
        paragraphWidth: "full",
        buttonContent: "EXPLORE MORE",
        mobileButtonContent: "EXPLORE NOW",
        mobileButtonVariant: "decor",
        to: "/collections",
        variant: "custom",
        textColor: "#FEF4EB",
        backgroundColor: "#00000000",
        borderColor: "#FEF4EB",
        textColorHover: "#29231E",
        backgroundColorHover: "#FEF4EB",
        borderColorHover: "#FEF4EB",
        textColorDecor: "#FEF4EB",
      },
    ],
  },
});
