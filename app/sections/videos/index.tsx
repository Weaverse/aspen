import type { HydrogenComponent } from "@weaverse/hydrogen";
import { type CSSProperties, forwardRef, type ReactNode } from "react";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface VideosProps extends SectionProps {
  children?: ReactNode;
  addToCartButtonPaddingVertical?: number;
  addToCartButtonPaddingHorizontal?: number;
  addToCartButtonGap?: number;
  addToCartButtonBorderRadius?: number;
  addToCartButtonBackgroundColor?: string;
  addToCartButtonTextColor?: string;
  addToCartButtonFontFamily?: "body" | "heading";
  addToCartButtonFontSize?: number;
  addToCartButtonFontStyle?: "normal" | "italic";
  addToCartButtonFontWeight?: "400" | "500" | "600" | "700";
  addToCartButtonLineHeight?: number;
  addToCartButtonLetterSpacing?: number;
}

let Videos = forwardRef<HTMLElement, VideosProps>((props, ref) => {
  let {
    children,
    style,
    addToCartButtonPaddingVertical = 8,
    addToCartButtonPaddingHorizontal = 12,
    addToCartButtonGap = 8,
    addToCartButtonBorderRadius = 8,
    addToCartButtonBackgroundColor = "#4D4946",
    addToCartButtonTextColor = "#F1EEEA",
    addToCartButtonFontFamily = "body",
    addToCartButtonFontSize = 12,
    addToCartButtonFontStyle = "normal",
    addToCartButtonFontWeight = "400",
    addToCartButtonLineHeight = 100,
    addToCartButtonLetterSpacing = 0.24,
    ...rest
  } = props;
  const buttonStyle = {
    ...style,
    "--videos-atc-padding-vertical": `${addToCartButtonPaddingVertical}px`,
    "--videos-atc-padding-horizontal": `${addToCartButtonPaddingHorizontal}px`,
    "--videos-atc-gap": `${addToCartButtonGap}px`,
    "--videos-atc-radius": `${addToCartButtonBorderRadius}px`,
    "--videos-atc-background": addToCartButtonBackgroundColor,
    "--videos-atc-text": addToCartButtonTextColor,
    "--videos-atc-font-family":
      addToCartButtonFontFamily === "heading"
        ? "var(--font-heading)"
        : "var(--font-body)",
    "--videos-atc-font-size": `${addToCartButtonFontSize}px`,
    "--videos-atc-font-style": addToCartButtonFontStyle,
    "--videos-atc-font-weight": addToCartButtonFontWeight,
    "--videos-atc-line-height": `${addToCartButtonLineHeight}%`,
    "--videos-atc-letter-spacing": `${addToCartButtonLetterSpacing}px`,
  } as CSSProperties;

  return (
    <Section
      ref={ref}
      {...rest}
      className="bg-white lg:bg-[#F4F4F5]"
      containerClassName="!max-w-[1360px] !space-y-10 [&>.heading]:text-left md:!space-y-16"
      style={buttonStyle}
    >
      {children}
    </Section>
  );
});

export let schema: HydrogenComponent["schema"] = {
  title: "Videos",
  type: "videos",
  settings: [
    ...sectionSettings,
    {
      group: "Add to cart button",
      inputs: [
        {
          type: "range",
          name: "addToCartButtonPaddingVertical",
          label: "Vertical padding",
          defaultValue: 8,
          configs: { min: 0, max: 24, step: 1, unit: "px" },
        },
        {
          type: "range",
          name: "addToCartButtonPaddingHorizontal",
          label: "Horizontal padding",
          defaultValue: 12,
          configs: { min: 0, max: 32, step: 1, unit: "px" },
        },
        {
          type: "range",
          name: "addToCartButtonGap",
          label: "Content gap",
          defaultValue: 8,
          configs: { min: 0, max: 20, step: 1, unit: "px" },
        },
        {
          type: "range",
          name: "addToCartButtonBorderRadius",
          label: "Border radius",
          defaultValue: 8,
          configs: { min: 0, max: 32, step: 1, unit: "px" },
        },
        {
          type: "color",
          name: "addToCartButtonBackgroundColor",
          label: "Background color",
          defaultValue: "#4D4946",
        },
        {
          type: "color",
          name: "addToCartButtonTextColor",
          label: "Text color",
          defaultValue: "#F1EEEA",
        },
        {
          type: "select",
          name: "addToCartButtonFontFamily",
          label: "Font family",
          defaultValue: "body",
          configs: {
            options: [
              { value: "body", label: "Body (DM Sans)" },
              { value: "heading", label: "Heading (Tenor Sans)" },
            ],
          },
        },
        {
          type: "range",
          name: "addToCartButtonFontSize",
          label: "Font size",
          defaultValue: 12,
          configs: { min: 10, max: 24, step: 1, unit: "px" },
        },
        {
          type: "select",
          name: "addToCartButtonFontStyle",
          label: "Font style",
          defaultValue: "normal",
          configs: {
            options: [
              { value: "normal", label: "Normal" },
              { value: "italic", label: "Italic" },
            ],
          },
        },
        {
          type: "select",
          name: "addToCartButtonFontWeight",
          label: "Font weight",
          defaultValue: "400",
          configs: {
            options: [
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
            ],
          },
        },
        {
          type: "range",
          name: "addToCartButtonLineHeight",
          label: "Line height",
          defaultValue: 100,
          configs: { min: 80, max: 200, step: 5, unit: "%" },
        },
        {
          type: "range",
          name: "addToCartButtonLetterSpacing",
          label: "Letter spacing",
          defaultValue: 0.24,
          configs: { min: 0, max: 1, step: 0.01, unit: "px" },
        },
      ],
    },
  ],
  childTypes: ["heading", "video--items"],
  presets: {
    width: "fixed",
    verticalPadding: "medium",
    gap: 40,
    addToCartButtonPaddingVertical: 8,
    addToCartButtonPaddingHorizontal: 12,
    addToCartButtonGap: 8,
    addToCartButtonBorderRadius: 8,
    addToCartButtonBackgroundColor: "#4D4946",
    addToCartButtonTextColor: "#F1EEEA",
    addToCartButtonFontFamily: "body",
    addToCartButtonFontSize: 12,
    addToCartButtonFontStyle: "normal",
    addToCartButtonFontWeight: "400",
    addToCartButtonLineHeight: 100,
    addToCartButtonLetterSpacing: 0.24,
    children: [
      {
        type: "heading",
        content: "VIDEOS",
        as: "h2",
        size: "scale",
        minSize: 36,
        maxSize: 44,
        alignment: "left",
        weight: "400",
        letterSpacing: "normal",
      },
      {
        type: "video--items",
      },
    ],
  },
};

Videos.displayName = "Videos";
export default Videos;
