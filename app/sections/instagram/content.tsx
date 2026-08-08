import { InstagramLogo } from "@phosphor-icons/react";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";

interface InstagramContentProps
  extends HydrogenComponentProps,
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
  backgroundColor?: string;
  borderColor?: string;
  textColorHover?: string;
  backgroundColorHover?: string;
  borderColorHover?: string;
  textColorDecor?: string;
}

let InstagramContent = forwardRef<HTMLDivElement, InstagramContentProps>(
  (props, ref) => {
    let {
      // Heading props
      headingContent,
      headingTagName,
      color,
      size,
      alignment,
      mobileSize,
      desktopSize,
      weight,
      letterSpacing,
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
      backgroundColor,
      borderColor,
      textColorHover,
      backgroundColorHover,
      borderColorHover,
      textColorDecor,
      ...rest
    } = props;

    const subheadingClasses = [
      subheadingAlignment === "center"
        ? "text-center"
        : subheadingAlignment === "right"
          ? "text-right"
          : "text-left",
      subheadingSize === "large" ? "text-sm" : "text-xs",
      subheadingWeight === "medium" ? "font-medium" : "font-normal",
    ].join(" ");

    const SubheadingTag = subheadingTag;

    return (
      <div
        ref={ref}
        {...rest}
        className="flex w-full flex-col rounded-lg bg-white p-6 lg:w-[320px] lg:flex-none"
      >
        <div className="flex flex-col gap-2.5">
          {headingContent && (
            <div className="flex items-center gap-2">
              <InstagramLogo size={14} weight="regular" />
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
                className="text-[10px] leading-none tracking-[0.08em]"
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
        </div>
        <div className="mt-5">
          {paragraphContent && (
            <Paragraph
              content={paragraphContent}
              as={paragraphTag}
              color={paragraphColor}
              textSize={paragraphSize}
              alignment={paragraphAlignment}
              width={paragraphWidth}
              className="text-xs leading-relaxed"
            />
          )}
        </div>
        {buttonContent && (
          <Link
            variant={variant}
            textColor={textColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            textColorHover={textColorHover}
            backgroundColorHover={backgroundColorHover}
            borderColorHover={borderColorHover}
            textColorDecor={textColorDecor}
            openInNewTab={openInNewTab}
            to={to}
            className="mt-6 w-fit bg-transparent p-0 text-[10px] tracking-[0.04em]"
          >
            <span className="inline-flex items-center gap-2">
              {buttonContent}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        )}
      </div>
    );
  },
);

export default InstagramContent;

export let schema = createSchema({
  type: "instagram--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Heading (optional)",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue: "Instagram",
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
          defaultValue: "@instagram",
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
            "Meet the room edits: real life shots of our furniture in action. (We like to think we style our furniture well, but we can't help but show off how you do it.)",
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
          defaultValue: "Follow us",
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
  ],
  presets: {
    headingContent: "INSTAGRAM",
    headingTagName: "h2",
    color: "#29231E",
    alignment: "left",
    subheadingContent: "@aspen_life",
    subheadingColor: "#524B46",
    subheadingSize: "base",
    subheadingWeight: "normal",
    subheadingAlignment: "left",
    paragraphContent:
      "Meet the room edits: real life shots of our furniture in action.",
    paragraphColor: "#524B46",
    paragraphSize: "xs",
    paragraphWidth: "full",
    paragraphAlignment: "left",
    buttonContent: "EXPLORE NOW",
    to: "https://www.instagram.com/",
    variant: "decor",
    textColorDecor: "#29231E",
  },
});
