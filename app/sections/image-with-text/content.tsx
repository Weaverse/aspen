import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { type CSSProperties, forwardRef } from "react";
import { cn } from "~/utils/cn";
import { useImageWithTextContext } from "./context";

const variants = cva("flex grow flex-col px-4 py-6 md:px-8 md:py-8", {
  variants: {
    gap: {
      "0": "gap-0",
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "5": "gap-5",
      "6": "gap-6",
      "8": "gap-8",
      "10": "gap-10",
      "12": "gap-12",
      "16": "gap-16",
      "20": "gap-20",
    },
    contentPosition: {
      "top left": "items-start justify-start",
      "top center": "items-center justify-start",
      "top right": "items-end justify-start",
      "center left": "items-start justify-center",
      "center center": "items-center justify-center",
      "center right": "items-end justify-center",
      "bottom left": "items-start justify-end",
      "bottom center": "items-center justify-end",
      "bottom right": "items-end justify-end",
    },
  },
  defaultVariants: {
    gap: "5",
    contentPosition: "top left",
  },
});

interface ImageWithTextContentProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  buttonAlignment?: "auto" | "left" | "center" | "right";
}

const ImageWithTextContent = forwardRef<
  HTMLDivElement,
  ImageWithTextContentProps
>((props, ref) => {
  const {
    gap = "5",
    contentPosition = "top left",
    buttonAlignment = "auto",
    children,
    ...rest
  } = props;
  const [vertical, horizontal] = (contentPosition || "top left").split(" ");
  const buttonPosition =
    buttonAlignment === "auto" ? horizontal : buttonAlignment;
  const contentStyle = {
    "--iwt-content-gap": `${Number(gap ?? 5) * 4}px`,
    "--iwt-content-align":
      horizontal === "left"
        ? "flex-start"
        : horizontal === "right"
          ? "flex-end"
          : "center",
    "--iwt-content-justify":
      vertical === "top"
        ? "flex-start"
        : vertical === "bottom"
          ? "flex-end"
          : "center",
    "--iwt-content-text-align": horizontal,
    "--iwt-button-align":
      buttonPosition === "left"
        ? "flex-start"
        : buttonPosition === "right"
          ? "flex-end"
          : "center",
  } as CSSProperties;
  const { imageCount, layout, isLegacyLayout } = useImageWithTextContext();
  const resolvedLayout = isLegacyLayout
    ? imageCount > 1
      ? "overlay"
      : "split"
    : layout;
  const isOverlay = resolvedLayout === "overlay";

  return (
    <div
      ref={ref}
      {...rest}
      style={contentStyle}
      className={cn(
        variants({ gap, contentPosition }),
        isOverlay &&
          "absolute inset-0 z-1 flex w-full px-5 pb-10 text-[#FEF4EB] [&_.button]:text-[#FEF4EB] md:px-16 md:pb-12 md:[&_h2]:text-[44px]",
        !isOverlay &&
          "h-auto w-full px-10 py-10 md:w-1/2 md:px-8 md:py-0 lg:h-full lg:px-16",
        "[text-align:var(--iwt-content-text-align)] [&_.heading]:w-full [&_.button]:[align-self:var(--iwt-button-align)]",
      )}
      data-content-layout={resolvedLayout}
    >
      {children}
    </div>
  );
});

export default ImageWithTextContent;

export const schema = createSchema({
  type: "image-with-text--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "gap",
          label: "Gap",
          defaultValue: "5",
          configs: {
            options: [
              { value: "0", label: "None" },
              { value: "1", label: "Extra Small" },
              { value: "2", label: "Small" },
              { value: "3", label: "Small+" },
              { value: "4", label: "Medium-" },
              { value: "5", label: "Medium" },
              { value: "6", label: "Medium+" },
              { value: "8", label: "Large" },
              { value: "10", label: "Extra Large" },
              { value: "12", label: "XXL" },
              { value: "16", label: "XXXL" },
              { value: "20", label: "Huge" },
            ],
          },
          helpText: "Control the spacing between child elements.",
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "top left",
        },
        {
          type: "toggle-group",
          name: "buttonAlignment",
          label: "Button alignment",
          configs: {
            options: [
              { value: "auto", label: "Auto" },
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "auto",
          helpText:
            "Auto follows Content position. Left, Center and Right position the buttons independently of heading and paragraph alignment.",
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    gap: "5",
    contentPosition: "top left",
    buttonAlignment: "auto",
    children: [
      {
        type: "heading",
        content: "Image with text",
        as: "h2",
        weight: "400",
        letterSpacing: "tight",
        alignment: "left",
      },
      {
        type: "paragraph",
        content:
          "Pair an image with text to introduce your store or tell a story.",
        width: "full",
        alignment: "left",
      },
      {
        type: "button",
        text: "EXPLORE NOW",
        to: "/collections",
        variant: "decor",
        textColorDecor: "#FEF4EB",
      },
    ],
  },
});
