import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import { overlayInputs } from "~/components/overlay";
import type { OverlayAndBackgroundProps } from "~/components/overlay-and-background";
import { OverlayAndBackground } from "~/components/overlay-and-background";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";
import { layoutInputs } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";
import { cn } from "~/utils/cn";

const variants = cva("flex h-full w-full items-end justify-center", {
  variants: {
    width: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto max-w-(--page-width) px-3 md:px-10 lg:px-16",
    },
    verticalPadding: {
      none: "",
      small: "py-4 md:py-6 lg:py-8",
      medium: "py-16 md:py-16 lg:py-20",
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
  },
});

export interface SlideProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    OverlayAndBackgroundProps,
    Omit<HeadingProps, "content"> {
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

const Slide = forwardRef<HTMLDivElement, SlideProps>((props, ref) => {
  const [scope] = useAnimation(ref);
  const {
    width,
    gap,
    verticalPadding,
    backgroundImage,
    enableOverlay,
    overlayOpacity,
    overlayColor,
    overlayColorHover,
    backgroundFit,
    backgroundPosition,
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
    children,
    ...rest
  } = props;

  // Generate dynamic classes for subheading text
  const subheadingClasses = [
    `text-${subheadingAlignment || "left"}`,
    subheadingSize === "large" ? "text-lg" : "text-base",
    subheadingWeight === "medium" ? "font-medium" : "font-normal",
  ].join(" ");

  // Create the subheading element based on the selected tag
  const SubheadingTag = subheadingTag;

  return (
    <div
      ref={scope}
      {...rest}
      className="h-full w-full"
      style={{ "--gap": `${gap}px` } as React.CSSProperties}
    >
      <OverlayAndBackground {...props} />
      <div className={cn(variants({ width, gap, verticalPadding }))}>
        <div className="flex max-w-full flex-col gap-4 md:flex-row md:gap-6">
          {/* Left Column */}
          <div className="flex w-full flex-col gap-(--gap) md:w-1/2">
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

          {/* Right Column */}
          <div className="flex w-full flex-col gap-(--gap) md:w-1/2 [&_.paragraph]:mx-[unset]">
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
        </div>
      </div>
    </div>
  );
});

export default Slide;

export const schema = createSchema({
  title: "Slide",
  type: "slideshow-slide",
  childTypes: [],
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    {
      group: "Heading (optional)",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue: "Slide with text overlay",
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
      group: "Subheading",
      inputs: [
        {
          type: "text",
          name: "subheadingContent",
          label: "Subheading content",
          defaultValue: "Subheading",
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
          defaultValue: "left",
        },
      ],
    },
    {
      group: "Paragraph",
      inputs: [
        {
          type: "richtext",
          name: "paragraphContent",
          label: "Paragraph content",
          defaultValue:
            "Use this text to share information about your brand with your customers. Describe a product, share announcements, or welcome customers to your store.",
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
          defaultValue: "left",
        },
      ],
    },
    {
      group: "Button",
      inputs: [
        {
          type: "text",
          name: "buttonContent",
          label: "Button text",
          defaultValue: "Shop all",
          placeholder: "Enter button text",
        },
        ...linkInputs
          .map((input) => {
            if (input.name === "text") {
              return null;
            }
            return input;
          })
          .filter(Boolean),
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs.filter((inp) =>
        ["backgroundImage", "backgroundFit", "backgroundPosition"].includes(
          inp.name as string,
        ),
      ),
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  presets: {
    verticalPadding: "large",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayOpacity: 50,
    headingContent: "Slide with text overlay",
    color: "#fff",
    size: "scale",
    subheadingColor: "#fff",
    paragraphContent:
      "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
    paragraphColor: "#fff",
    paragraphWidth: "full",
    buttonContent: "Shop all",
    to: "/products",
    variant: "decor",
    textColorDecor: "#fff",
  },
});
