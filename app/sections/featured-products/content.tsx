import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import Heading, { headingInputs, type HeadingProps } from "~/components/heading";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";
import Link, { linkInputs, type LinkProps } from "~/components/link";

interface FeaturedProductsLoaderData
  extends HydrogenComponentProps,
    VariantProps<typeof variants>,
    Omit<HeadingProps, "content"> {
  // Layout props
  displayMode?: "vertical" | "horizontal";
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
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

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      left: "justify-center items-start [&_.paragraph]:[text-align:left]",
      center: "justify-center items-center [&_.paragraph]:[text-align:center]",
      right: "justify-center items-end [&_.paragraph]:[text-align:right]",
    },
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
    gap: 32,
  },
});

const FeaturedContentProducts = forwardRef<
  HTMLDivElement,
  FeaturedProductsLoaderData
>((props, ref) => {
  const { 
    gap, 
    contentPosition,
    displayMode = "vertical",
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
  
  if (displayMode === "horizontal") {
    return (
      <div
        ref={ref}
        {...rest}
        className="flex justify-between items-center w-full"
      >
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
            alignment="left"
            minSize={minSize}
            maxSize={maxSize}
            animate={animate}
            className="flex-1"
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
            className="w-fit flex-shrink-0 mr-1"
          >
            {buttonContent}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({
        contentPosition,
        gap,
      })}
    >
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
      {paragraphContent && (
        <Paragraph
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
});

export default FeaturedContentProducts;

export const schema = createSchema({
  type: "featured-content-products",
  title: "Featured content products",
  limit: 1,
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "displayMode",
          label: "Display mode",
          defaultValue: "vertical",
          configs: {
            options: [
              { value: "vertical", label: "Vertical" },
              { value: "horizontal", label: "Horizontal" },
            ],
          },
        },
        {
          type: "toggle-group",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "left" },
              { value: "center", label: "center" },
              { value: "right", label: "right" },
            ],
          },
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
        },
        {
          type: "range",
          name: "gap",
          label: "Gap",
          defaultValue: 32,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
        },
      ],
    },
    {
      group: "Heading (optional)",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue: "Featured products",
          placeholder: "Enter heading text",
        },
        ...headingInputs.map((input) => {
          if (input.name === "as") {
            return {
              ...input,
              name: "headingTagName",
            };
          }
          return input;
        }),
      ],
    },
    {
      group: "Paragraph (optional)",
      inputs: [
        {
          type: "richtext",
          name: "paragraphContent",
          label: "Paragraph content",
          defaultValue: "Discover nomad, our best-selling and most-awarded modular seating.",
          placeholder: "Enter paragraph text",
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
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
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
        },
        {
          type: "color",
          name: "paragraphColor",
          label: "Text color",
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
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
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
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
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
        },
        {
          type: "toggle-group",
          name: "paragraphAlignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              { value: "center", label: "Center", icon: "align-center-vertical" },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
          condition: (data: FeaturedProductsLoaderData) => data.displayMode === "vertical",
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
          defaultValue: "EXPLORE NOW",
          placeholder: "Enter button text",
        },
        ...linkInputs.map((input) => {
          if (input.name === "text") {
            return null;
          }
          return input;
        }).filter(Boolean),
      ],
    },
  ],
  presets: {
    displayMode: "vertical",
    gap: 32,
    headingContent: "Featured products",
    paragraphContent: "Discover nomad, our best-selling and most-awarded modular seating.",
    buttonContent: "EXPLORE NOW",
    variant: "decor",
  },
});
