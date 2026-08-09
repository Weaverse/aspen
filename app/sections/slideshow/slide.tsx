import {
  createSchema,
  type HydrogenComponentProps,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import {
  BackgroundImage,
  type BackgroundImageProps,
  backgroundInputs,
} from "~/components/background-image";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import { Overlay, overlayInputs } from "~/components/overlay";
import type { OverlayAndBackgroundProps } from "~/components/overlay-and-background";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";
import { layoutInputs } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";
import { cn } from "~/utils/cn";

const variants = cva("flex h-full w-full items-end", {
  variants: {
    width: {
      full: "",
      stretch: "px-[26px] md:px-(--page-padding)",
      fixed:
        "mx-auto max-w-(--page-width) px-[26px] md:px-(--page-padding) 2xl:px-0",
    },
    verticalPadding: {
      none: "",
      small: "py-4 md:py-6",
      medium: "py-5 md:py-10",
      large: "pt-6 pb-14 md:pt-16 md:pb-[140px]",
    },
    contentPosition: {
      "top left": "items-start justify-start",
      "top center": "items-start justify-center",
      "top right": "items-start justify-end",
      "center left": "items-center justify-start",
      "center center": "items-center justify-center",
      "center right": "items-center justify-end",
      "bottom left": "items-end justify-start",
      "bottom center": "items-end justify-center",
      "bottom right": "items-end justify-end",
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
  mobileHeadingContent?: string;
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
  mobileParagraphContent?: string;
  paragraphTag?: "p" | "div";
  paragraphColor?: string;
  paragraphSize?: ParagraphProps["textSize"];
  paragraphAlignment?: ParagraphProps["alignment"];
  paragraphWidth?: ParagraphProps["width"];
  // Button/Link props
  buttonContent?: string;
  mobileButtonContent?: string;
  mobileButtonVariant?: LinkProps["variant"];
  to?: LinkProps["to"];
  variant?: LinkProps["variant"];
  openInNewTab?: boolean;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColorHover?: string;
  backgroundColorHover?: string;
  borderColorHover?: string;
  textColorDecor?: string;
  mobileBackgroundImage?: WeaverseImage | string;
  mobileBackgroundPosition?: BackgroundImageProps["backgroundPosition"];
}

const LEGACY_SLIDESHOW_IMAGE_PREFIX = "/images/slideshow/";

function resolveSlideImage(image?: WeaverseImage | string) {
  if (
    typeof image === "string" &&
    image.startsWith(LEGACY_SLIDESHOW_IMAGE_PREFIX)
  ) {
    return undefined;
  }

  return image;
}

const Slide = forwardRef<HTMLDivElement, SlideProps>((props, ref) => {
  const [scope] = useAnimation(ref);
  const {
    width,
    gap,
    verticalPadding,
    contentPosition,
    backgroundImage,
    enableOverlay,
    overlayOpacity,
    overlayColor,
    overlayColorHover,
    backgroundFit,
    backgroundPosition,
    mobileBackgroundImage,
    mobileBackgroundPosition,
    // Heading props
    headingContent,
    mobileHeadingContent,
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
    mobileParagraphContent,
    paragraphTag = "p",
    paragraphColor,
    paragraphSize,
    paragraphAlignment,
    paragraphWidth,
    // Button/Link props
    buttonContent,
    mobileButtonContent,
    mobileButtonVariant,
    to,
    variant,
    openInNewTab,
    textColor,
    backgroundColor,
    borderColor,
    textColorHover,
    backgroundColorHover,
    borderColorHover,
    textColorDecor = "#FEF4EB",
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
  const mobileHeading = mobileHeadingContent || headingContent;
  const mobileParagraph = mobileParagraphContent || paragraphContent;
  const mobileButton = mobileButtonContent || buttonContent;
  const desktopImage = resolveSlideImage(backgroundImage);
  const mobileImage = resolveSlideImage(mobileBackgroundImage);
  const desktopDisplayImage = desktopImage || mobileImage;
  const mobileDisplayImage = mobileImage || desktopImage;
  const defaultHeadingClassName =
    size === "default"
      ? cn(
          "text-[36px] leading-[1.05] md:text-[48px]",
          (!letterSpacing || letterSpacing === "normal") &&
            "tracking-[0.038em]",
        )
      : undefined;

  return (
    <div
      ref={scope}
      {...rest}
      className="relative isolate h-full w-full overflow-hidden"
      style={{ "--gap": `${gap}px` } as React.CSSProperties}
    >
      <div className="absolute inset-0 z-[-2] hidden md:block">
        <BackgroundImage
          backgroundImage={desktopDisplayImage}
          backgroundFit={backgroundFit}
          backgroundPosition={backgroundPosition}
        />
      </div>
      <div className="absolute inset-0 z-[-2] md:hidden">
        <BackgroundImage
          backgroundImage={mobileDisplayImage}
          backgroundFit={backgroundFit}
          backgroundPosition={mobileBackgroundPosition || backgroundPosition}
        />
      </div>
      <Overlay
        enableOverlay={enableOverlay}
        overlayColor={overlayColor}
        overlayColorHover={overlayColorHover}
        overlayOpacity={overlayOpacity}
      />
      <div
        className={cn(
          variants({ width, gap, verticalPadding, contentPosition }),
        )}
      >
        <div className="flex w-full max-w-[720px] flex-col gap-(--gap)">
          {headingContent && (
            <div className="hidden md:block">
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
                className={defaultHeadingClassName}
              />
            </div>
          )}
          {mobileHeading && (
            <div className="md:hidden">
              <Heading
                content={mobileHeading}
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
                className={defaultHeadingClassName}
              />
            </div>
          )}
          {subheadingContent && (
            <SubheadingTag
              className={subheadingClasses}
              style={{ color: subheadingColor }}
            >
              {subheadingContent}
            </SubheadingTag>
          )}
          {paragraphContent && (
            <div className="hidden [&_.paragraph]:mx-0 md:block">
              <Paragraph
                content={paragraphContent}
                as={paragraphTag}
                color={paragraphColor}
                textSize={paragraphSize}
                alignment={paragraphAlignment}
                width={paragraphWidth}
                className={cn(
                  (!paragraphSize || paragraphSize === "base") &&
                    "text-[16px] leading-[1.5] tracking-[0.0085em]",
                )}
              />
            </div>
          )}
          {mobileParagraph && (
            <div className="[&_.paragraph]:mx-0 md:hidden">
              <Paragraph
                content={mobileParagraph}
                as={paragraphTag}
                color={paragraphColor}
                textSize={paragraphSize}
                alignment={paragraphAlignment}
                width={paragraphWidth}
              />
            </div>
          )}
          {buttonContent && (
            <div className="hidden md:block">
              <Link
                variant="custom"
                textColor={textColor || "#FEF4EB"}
                backgroundColor="#00000000"
                borderColor="#FEF4EB"
                textColorHover={textColorHover}
                backgroundColorHover={backgroundColorHover}
                borderColorHover={borderColorHover}
                textColorDecor={textColorDecor}
                openInNewTab={openInNewTab}
                to={to}
                className="min-w-[175px] w-fit py-[19px] tracking-[0.033em]"
              >
                {buttonContent}
              </Link>
            </div>
          )}
          {mobileButton && (
            <div className="md:hidden">
              <Link
                variant={mobileButtonVariant || variant}
                textColor={textColor}
                backgroundColor={backgroundColor}
                borderColor={borderColor}
                textColorHover={textColorHover}
                backgroundColorHover={backgroundColorHover}
                borderColorHover={borderColorHover}
                textColorDecor={textColorDecor}
                openInNewTab={openInNewTab}
                to={to}
                className="w-fit text-sm text-[#FEF4EB]!"
              >
                {mobileButton}
              </Link>
            </div>
          )}
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
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "bottom left",
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
    {
      group: "Mobile overrides",
      inputs: [
        {
          type: "image",
          name: "mobileBackgroundImage",
          label: "Mobile background image",
          helpText: "Leave blank to use the desktop background image.",
        },
        {
          type: "position",
          name: "mobileBackgroundPosition",
          label: "Mobile image position",
          defaultValue: "center center",
          condition: (data: SlideProps) => Boolean(data.mobileBackgroundImage),
        },
        {
          type: "text",
          name: "mobileHeadingContent",
          label: "Mobile heading",
          helpText: "Leave blank to use the desktop heading.",
        },
        {
          type: "richtext",
          name: "mobileParagraphContent",
          label: "Mobile paragraph",
          helpText: "Leave blank to use the desktop paragraph.",
        },
        {
          type: "text",
          name: "mobileButtonContent",
          label: "Mobile button text",
          helpText: "Leave blank to use the desktop button text.",
        },
        {
          type: "select",
          name: "mobileButtonVariant",
          label: "Mobile button style",
          configs: {
            options: [
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Outline", value: "outline" },
              { label: "Decoration", value: "decor" },
              { label: "Underline", value: "underline" },
              { label: "Custom styles", value: "custom" },
            ],
          },
          defaultValue: "decor",
          condition: (data: SlideProps) => Boolean(data.mobileButtonContent),
        },
      ],
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  presets: {
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
});
