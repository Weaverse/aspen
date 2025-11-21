import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { BackgroundImage } from "~/components/background-image";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import type { OverlayProps } from "~/components/overlay";
import { Overlay, overlayInputs } from "~/components/overlay";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";

const variants = cva(
  [
    "promotion-grid-item",
    "group/overlay",
    "relative flex aspect-square flex-col gap-4 overflow-hidden p-4",
    "[&_.paragraph]:mx-[unset]",
  ],
  {
    variants: {
      contentPosition: {
        "top left": "items-start justify-start [&_.paragraph]:text-left",
        "top center": "items-center justify-start [&_.paragraph]:text-center",
        "top right": "items-end justify-start [&_.paragraph]:text-right",
        "center left": "items-start justify-center [&_.paragraph]:text-left",
        "center center":
          "items-center justify-center [&_.paragraph]:text-center",
        "center right": "items-end justify-center [&_.paragraph]:text-right",
        "bottom left": "items-start justify-end [&_.paragraph]:text-left",
        "bottom center": "items-center justify-end [&_.paragraph]:text-center",
        "bottom right": "items-end justify-end [&_.paragraph]:text-right",
      },
      borderRadius: {
        0: "",
        2: "rounded-xs",
        4: "rounded-sm",
        6: "rounded-md",
        8: "rounded-lg",
        10: "rounded-[10px]",
        12: "rounded-xl",
        14: "rounded-[14px]",
        16: "rounded-2xl",
        18: "rounded-[18px]",
        20: "rounded-[20px]",
        22: "rounded-[22px]",
        24: "rounded-3xl",
        26: "rounded-[26px]",
        28: "rounded-[28px]",
        30: "rounded-[30px]",
        32: "rounded-[32px]",
        34: "rounded-[34px]",
        36: "rounded-[36px]",
        38: "rounded-[38px]",
        40: "rounded-[40px]",
      },
    },
  },
);

interface PromotionItemProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    OverlayProps,
    Omit<HeadingProps, "content"> {
  backgroundImage: WeaverseImage | string;
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  // Subheading props
  subheadingContent?: string;
  subheadingTag?: "h4" | "h5" | "h6" | "div" | "p";
  subheadingColor?: string;
  subheadingSize?: "base" | "large";
  subheadingWeight?: "normal" | "medium";
  subheadingAlignment?: "left" | "center" | "right";
  // Paragraph props
  paragraphContent?: string;
  paragraphTag?: "p" | "div";
  paragraphColor?: string;
  paragraphSize?: ParagraphProps["textSize"];
  paragraphAlignment?: ParagraphProps["alignment"];
  paragraphWidth?: ParagraphProps["width"];
  // Button/Link props
  buttonContent?: string;
  to?: LinkProps["to"];
  variant?: LinkProps["variant"];
  openInNewTab?: boolean;
  textColor?: string;
  buttonBackgroundColor?: string;
  borderColor?: string;
  textColorHover?: string;
  backgroundColorHover?: string;
  borderColorHover?: string;
  textColorDecor?: string;
}

const PromotionGridItem = forwardRef<HTMLDivElement, PromotionItemProps>(
  (props, ref) => {
    const {
      contentPosition,
      backgroundImage,
      borderRadius,
      enableOverlay,
      overlayColor,
      overlayColorHover,
      overlayOpacity,
      // Heading props
      headingContent,
      headingTagName,
      color,
      size,
      mobileSize,
      desktopSize,
      weight,
      letterSpacing,
      alignment,
      minSize,
      maxSize,
      animate,
      // Subheading props
      subheadingContent,
      subheadingTag = "p",
      subheadingColor,
      subheadingSize,
      subheadingWeight,
      subheadingAlignment,
      // Paragraph props
      paragraphContent,
      paragraphTag = "p",
      paragraphColor,
      paragraphSize,
      paragraphAlignment,
      paragraphWidth,
      // Button/Link props
      buttonContent,
      to,
      variant,
      openInNewTab,
      textColor,
      buttonBackgroundColor,
      borderColor,
      textColorHover,
      backgroundColorHover,
      borderColorHover,
      textColorDecor,
      ...rest
    } = props;

    // Generate dynamic classes for subheading text
    const subheadingClasses = [
      `text-${subheadingAlignment || "center"}`,
      subheadingSize === "large" ? "text-lg" : "text-base",
      subheadingWeight === "medium" ? "font-medium" : "font-normal",
    ].join(" ");

    // Create the subheading element based on the selected tag
    const SubheadingTag = subheadingTag;

    return (
      <div
        ref={ref}
        {...rest}
        data-motion="slide-in"
        className={variants({ contentPosition, borderRadius })}
      >
        <BackgroundImage backgroundImage={backgroundImage} />
        <Overlay
          enableOverlay={enableOverlay}
          overlayColor={overlayColor}
          overlayColorHover={overlayColorHover}
          overlayOpacity={overlayOpacity}
        />
        <div className="flex flex-col gap-2">
          {headingContent && (
            <Heading
              content={headingContent}
              as={headingTagName}
              color={color}
              size={size}
              mobileSize={mobileSize}
              desktopSize={desktopSize}
              weight={weight}
              letterSpacing={letterSpacing}
              alignment={alignment}
              minSize={minSize}
              maxSize={maxSize}
              animate={animate}
            />
          )}
          {subheadingContent && (
            <SubheadingTag
              className={subheadingClasses}
              style={{ color: subheadingColor }}
            >
              {subheadingContent}
            </SubheadingTag>
          )}
        </div>
        {paragraphContent && (
          <Paragraph
            className="ff-heading"
            content={paragraphContent}
            as={paragraphTag}
            color={paragraphColor}
            textSize={paragraphSize}
            alignment={paragraphAlignment}
            width={paragraphWidth}
          />
        )}
        {buttonContent && (
          <Link
            variant={variant}
            textColor={textColor}
            backgroundColor={buttonBackgroundColor}
            borderColor={borderColor}
            textColorHover={textColorHover}
            backgroundColorHover={backgroundColorHover}
            borderColorHover={borderColorHover}
            textColorDecor={textColorDecor}
            openInNewTab={openInNewTab}
            to={to}
            className="w-fit"
          >
            {buttonContent}
          </Link>
        )}
      </div>
    );
  },
);

export default PromotionGridItem;

export const schema = createSchema({
  type: "promotion-grid-item",
  title: "Promotion",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "position",
          label: "Content position",
          name: "contentPosition",
          defaultValue: "center center",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        {
          type: "image",
          name: "backgroundImage",
          label: "Background image",
        },
        {
          type: "heading",
          label: "Overlay",
        },
        ...overlayInputs,
      ],
    },
    {
      group: "Heading (optional)",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          placeholder: "Enter heading text",
        },
        ...headingInputs.map((input) => {
          if (input.name === "as") {
            return {
              ...input,
              name: "headingTagName",
              label: "Text size",
            } as any;
          }
          if (input.name === "content") {
            return {
              ...input,
              name: "headingContent",
            } as any;
          }
          if (input.name === "alignment") {
            return {
              ...input,
              defaultValue: "center",
            } as any;
          }
          return input as any;
        }),
      ],
    },
    {
      group: "Subheading (optional)",
      inputs: [
        {
          type: "text",
          name: "subheadingContent",
          label: "Subheading content",
          placeholder: "Enter subheading text",
        },
        {
          type: "select",
          name: "subheadingTag",
          label: "Tag name",
          configs: {
            options: [
              { value: "h4", label: "Heading 4" },
              { value: "h5", label: "Heading 5" },
              { value: "h6", label: "Heading 6" },
              { value: "p", label: "Paragraph" },
              { value: "div", label: "Div" },
            ],
          },
          defaultValue: "p",
        },
        {
          type: "color",
          name: "subheadingColor",
          label: "Text color",
        },
        {
          type: "select",
          name: "subheadingSize",
          label: "Text size",
          configs: {
            options: [
              { value: "base", label: "Base" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "select",
          name: "subheadingWeight",
          label: "Weight",
          configs: {
            options: [
              { value: "normal", label: "Normal" },
              { value: "medium", label: "Medium" },
            ],
          },
          defaultValue: "normal",
        },
        {
          type: "toggle-group",
          name: "subheadingAlignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "center",
        },
      ],
    },
    {
      group: "Paragraph (optional)",
      inputs: [
        {
          type: "richtext",
          name: "paragraphContent",
          label: "Paragraph content",
          placeholder: "Enter paragraph text",
        },
        {
          type: "select",
          name: "paragraphTag",
          label: "HTML tag",
          configs: {
            options: [
              { value: "p", label: "<p> (Paragraph)" },
              { value: "div", label: "<div> (Div)" },
            ],
          },
          defaultValue: "p",
        },
        {
          type: "color",
          name: "paragraphColor",
          label: "Text color",
        },
        {
          type: "select",
          name: "paragraphSize",
          label: "Text size",
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "toggle-group",
          name: "paragraphWidth",
          label: "Width",
          configs: {
            options: [
              { value: "full", label: "Full", icon: "move-horizontal" },
              {
                value: "narrow",
                label: "Narrow",
                icon: "fold-horizontal",
              },
            ],
          },
          defaultValue: "full",
        },
        {
          type: "toggle-group",
          name: "paragraphAlignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "center",
        },
      ],
    },
    {
      group: "Button (optional)",
      inputs: [
        {
          type: "text",
          name: "buttonContent",
          label: "Button text",
          placeholder: "Enter button text",
        },
        ...(linkInputs
          .map((input) => {
            if (input.name === "text") {
              return null;
            }
            return input;
          })
          .filter(Boolean) as any),
      ],
    },
  ],
  presets: {
    contentPosition: "center center",
    backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
    enableOverlay: true,
    overlayColor: "#0c0c0c",
    overlayOpacity: 20,
    headingContent: "Announce your promotion",
    paragraphContent:
      "Include the smaller details of your promotion in text below the title.",
    buttonContent: "EXPLORE NOW",
    variant: "decor",
  },
});
