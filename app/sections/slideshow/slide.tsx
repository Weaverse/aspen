import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { OverlayAndBackgroundProps } from "~/components/overlay-and-background";
import { OverlayAndBackground } from "~/components/overlay-and-background";
import { layoutInputs } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";

let variants = cva("w-full h-full flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    width: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "max-w-(--page-width) mx-auto px-3 md:px-10 lg:px-16",
    },
    verticalPadding: {
      none: "",
      small: "py-4 md:py-6 lg:py-8",
      medium: "py-8 md:py-12 lg:py-16",
      large: "py-12 md:py-24 lg:py-32",
    },
    gap: {
      0: "",
      4: "space-y-1",
      8: "space-y-2",
      12: "space-y-3",
      16: "space-y-4",
      20: "space-y-5",
      24: "space-y-3 lg:space-y-6",
      28: "space-y-3.5 lg:space-y-7",
      32: "space-y-4 lg:space-y-8",
      36: "space-y-4 lg:space-y-9",
      40: "space-y-5 lg:space-y-10",
      44: "space-y-5 lg:space-y-11",
      48: "space-y-6 lg:space-y-12",
      52: "space-y-6 lg:space-y-[52px]",
      56: "space-y-7 lg:space-y-14",
      60: "space-y-7 lg:space-y-[60px]",
    },
    contentPosition: {
      "top left": "justify-start items-start [&_.paragraph]:text-left",
      "top center": "justify-start items-center [&_.paragraph]:text-center",
      "top right": "justify-start items-end [&_.paragraph]:text-right",
      "center left": "justify-center items-start [&_.paragraph]:text-left",
      "center center": "justify-center items-center [&_.paragraph]:text-center",
      "center right": "justify-center items-end [&_.paragraph]:text-right",
      "bottom left": "justify-end items-start [&_.paragraph]:text-left",
      "bottom center": "justify-end items-center [&_.paragraph]:text-center",
      "bottom right": "justify-end items-end [&_.paragraph]:text-right",
    },
  },
  defaultVariants: {
    contentPosition: "bottom left",
  },
});

export interface SlideProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    OverlayAndBackgroundProps {
  backgroundColor: string;
}

let Slide = forwardRef<HTMLDivElement, SlideProps>((props, ref) => {
  const [scope] = useAnimation(ref);
  let {
    contentPosition,
    width,
    gap,
    verticalPadding,
    backgroundColor,
    backgroundImage,
    enableOverlay,
    overlayOpacity,
    overlayColor,
    overlayColorHover,
    backgroundFit,
    backgroundPosition,
    children,
    ...rest
  } = props;

  return (
    <div ref={scope} {...rest} className="w-full h-full">
      <OverlayAndBackground {...props} />
      <div
        className={variants({ contentPosition, width, gap, verticalPadding })}
      >
        {children}
      </div>
    </div>
  );
});

export default Slide;

export let schema = createSchema({
  title: "Slide",
  type: "slideshow-slide",
  childTypes: ["subheading", "heading", "paragraph", "button"],
  settings: [
    {
      group: "Slide",
      inputs: [
        {
          type: "position",
          label: "Content position",
          name: "contentPosition",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs.filter((inp) =>
        ["backgroundImage", "backgroundFit", "backgroundPosition"].includes(
          inp.name,
        ),
      ),
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  presets: {
    verticalPadding: "large",
    contentPosition: "center center",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayOpacity: 50,
    children: [
      {
        type: "subheading",
        content: "Subheading",
        color: "#fff",
      },
      {
        type: "heading",
        content: "Slide with text overlay",
        color: "#fff",
        size: "scale",
        minSize: 16,
        maxSize: 56,
      },
      {
        type: "paragraph",
        content:
          "Use this text to share information about your brand with your customers. Describe a product, share announcements, or welcome customers to your store.",
        color: "#fff",
      },
      {
        type: "button",
        content: "Shop all",
        variant: "custom",
        backgroundColor: "#00000000",
        textColor: "#fff",
        borderColor: "#fff",
        backgroundColorHover: "#fff",
        textColorHover: "#000",
        borderColorHover: "#fff",
      },
    ],
  },
});
