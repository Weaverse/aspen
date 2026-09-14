import { InstagramLogo } from "@phosphor-icons/react";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import Heading from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import Paragraph from "~/components/paragraph";
import { useTranslatedText } from "~/hooks/use-translated-text";

interface InstagramContentProps extends HydrogenComponentProps {
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  color?: string;
  // Subheading props
  subheadingContent?: string;
  subheadingTag?: "h4" | "h5" | "h6" | "div" | "p";
  subheadingColor?: string;
  // Paragraph props
  paragraphContent?: string;
  paragraphTag?: "p" | "div";
  paragraphColor?: string;
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
    const translateText = useTranslatedText();

    let {
      // Heading props
      headingContent: rawI18nHeadingContent,
      headingTagName,
      color,
      // Subheading props
      subheadingContent: rawI18nSubheadingContent,
      subheadingTag = "p",
      subheadingColor,
      // Paragraph props
      paragraphContent: rawI18nParagraphContent,
      paragraphTag = "p",
      paragraphColor,
      // Button/Link props
      buttonContent: rawI18nButtonContent,
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
    const buttonContent = translateText(
      rawI18nButtonContent,
      "themeContent.sectionsInstagramContent.buttonContent",
    );
    const paragraphContent = translateText(
      rawI18nParagraphContent,
      "themeContent.sectionsInstagramContent.paragraphContent",
    );
    const subheadingContent = translateText(
      rawI18nSubheadingContent,
      "themeContent.sectionsInstagramContent.subheadingContent",
    );
    const headingContent = translateText(
      rawI18nHeadingContent,
      "themeContent.sectionsInstagramContent.headingContent",
    );

    const SubheadingTag = subheadingTag;

    return (
      <div
        ref={ref}
        {...rest}
        className="instagram-content flex w-full flex-col items-start gap-6 rounded-[var(--Radius-border-radius-md,12px)] bg-white p-6 md:w-[320px] md:flex-none md:self-stretch desktop:w-[320px] desktop:self-start"
      >
        <div className="flex w-full flex-col items-start gap-2.5">
          {headingContent && (
            <div className="flex items-center gap-2">
              <InstagramLogo className="size-5 shrink-0" weight="regular" />
              <Heading
                content={headingContent}
                as={headingTagName}
                color={color}
                alignment="left"
                className="text-xs leading-none tracking-[0.1em]"
              />
            </div>
          )}
          {subheadingContent && (
            <SubheadingTag
              className="text-left font-normal text-base leading-[1.4]"
              style={{ color: subheadingColor }}
            >
              {subheadingContent}
            </SubheadingTag>
          )}
        </div>
        {paragraphContent && (
          <Paragraph
            content={paragraphContent}
            as={paragraphTag}
            color={paragraphColor}
            alignment="left"
            width="full"
            className="w-full text-left text-sm leading-[1.6]"
          />
        )}
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
            className="w-fit self-start bg-transparent p-0 font-semibold text-sm tracking-[0.02em]"
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
        {
          type: "select",
          name: "headingTagName",
          label: "HTML tag",
          configs: {
            options: [
              { value: "h2", label: "Heading 2" },
              { value: "h3", label: "Heading 3" },
              { value: "h4", label: "Heading 4" },
              { value: "h5", label: "Heading 5" },
              { value: "h6", label: "Heading 6" },
            ],
          },
          defaultValue: "h2",
        },
        {
          type: "color",
          name: "color",
          label: "Text color",
        },
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
    subheadingContent: "@aspen_life",
    subheadingColor: "#524B46",
    paragraphContent:
      "Meet the room edits: real life shots of our furniture in action.",
    paragraphColor: "#524B46",
    buttonContent: "EXPLORE NOW",
    to: "https://www.instagram.com/",
    variant: "decor",
    textColorDecor: "#29231E",
  },
});
