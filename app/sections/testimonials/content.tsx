import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Quotes,
  Star,
} from "@phosphor-icons/react";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import { cn } from "~/utils/cn";
import { useTestimonialNavigation } from "./context";

interface TestimonialContentProps
  extends Omit<HeadingProps, "as">,
    Omit<HydrogenComponentProps, "content"> {
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  description?: string;
  ratting?: number;
  author?: string;
  // Description styling props
  subHeadingTag?: "h4" | "h5" | "h6" | "div" | "p";
  subHeadingSize?: "base" | "large";
  subHeadingWeight?: "normal" | "medium";
  subHeadingColor?: string;
  subHeadingAlignment?: "left" | "center" | "right";
}

const BLOCK_HTML_PATTERN =
  /<(?:article|blockquote|div|h[1-6]|li|ol|p|section|table|ul)\b/i;

function getSafeRichTextElement(
  description: string | undefined,
  preferredTag: NonNullable<TestimonialContentProps["subHeadingTag"]>,
) {
  if (!description) {
    return { Tag: preferredTag, html: "" };
  }

  const trimmedDescription = description.trim();
  const singleParagraphMatch = trimmedDescription.match(
    /^<p(?:\s[^>]*)?>([\s\S]*)<\/p>$/i,
  );
  const hasMultipleParagraphs = /<\/p>\s*<p(?:\s|>)/i.test(trimmedDescription);

  if (singleParagraphMatch && !hasMultipleParagraphs) {
    return { Tag: preferredTag, html: singleParagraphMatch[1] };
  }

  if (BLOCK_HTML_PATTERN.test(trimmedDescription)) {
    return { Tag: "div" as const, html: trimmedDescription };
  }

  return { Tag: preferredTag, html: trimmedDescription };
}

let TestimonialContent = forwardRef<HTMLDivElement, TestimonialContentProps>(
  (props, ref) => {
    let {
      alignment,
      headingTagName,
      color,
      size,
      mobileSize,
      desktopSize,
      minSize,
      maxSize,
      weight,
      letterSpacing,
      content = "TESTIMONIALS",
      description,
      ratting = 5,
      author,
      // Description styling props
      subHeadingTag = "h4",
      subHeadingSize = "large",
      subHeadingWeight = "normal",
      subHeadingColor = "var(--color-text-subtle)",
      subHeadingAlignment = "left",
      children,
      ...rest
    } = props;

    const descriptionClasses = [
      subHeadingAlignment === "center"
        ? "text-center"
        : subHeadingAlignment === "right"
          ? "text-right"
          : "text-left",
      subHeadingSize === "large" ? "text-lg lg:text-xl" : "text-base",
      subHeadingWeight === "medium" ? "font-medium" : "font-normal",
    ].join(" ");

    const { Tag: DescriptionTag, html: descriptionHtml } =
      getSafeRichTextElement(description, subHeadingTag);

    const {
      canGoPrevious,
      canGoNext,
      goToPrevious,
      goToNext,
      navigationButtonColor,
      navigationButtonHoverColor,
      navigationIconColor,
      navigationIcon,
      navigationShape,
    } = useTestimonialNavigation();
    const PreviousIcon = navigationIcon === "caret" ? CaretLeft : ArrowLeft;
    const NextIcon = navigationIcon === "caret" ? CaretRight : ArrowRight;
    const navigationShapeClass =
      navigationShape === "circle"
        ? "rounded-full"
        : navigationShape === "square"
          ? "rounded-none"
          : "rounded-lg";

    const renderStars = () => {
      return Array.from({ length: Math.max(0, ratting ?? 0) }, (_, index) => (
        <Star
          size={20}
          weight="fill"
          className="text-[#9d9d9d]"
          fill="currentColor"
          key={index}
        />
      ));
    };
    return (
      <div
        ref={ref}
        {...rest}
        className="order-2 flex min-w-0 flex-col px-5 pt-5 pb-10 lg:order-1 lg:h-[648px] lg:px-0 lg:py-0"
      >
        {content && (
          <Heading
            content={content}
            as={headingTagName}
            color={color}
            size={size}
            mobileSize={mobileSize}
            desktopSize={desktopSize}
            minSize={minSize}
            maxSize={maxSize}
            weight={weight}
            letterSpacing={letterSpacing}
            alignment={alignment}
            className="text-[28px] leading-none lg:text-[36px]"
          />
        )}
        <div className="mt-16 flex flex-1 flex-col justify-end lg:mt-0 lg:pb-0">
          <div className="flex max-w-[430px] flex-col gap-4 lg:gap-5">
            <Quotes size={28} className="rotate-180 lg:size-8" />
            {descriptionHtml && (
              <DescriptionTag
                className={`testimonial-description ${descriptionClasses}`}
                style={{ color: subHeadingColor }}
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            )}
          </div>
          <div className="mt-7 flex items-end justify-between lg:mt-8">
            <div className="flex flex-col gap-2">
              <span className="flex gap-0.5">{renderStars()}</span>
              <p className="text-[11px] leading-none">{author}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous testimonial"
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                className={cn(
                  "flex size-12 items-center justify-center bg-(--testimonial-nav-bg) text-(--testimonial-nav-color) transition-colors hover:bg-(--testimonial-nav-bg-hover)",
                  navigationShapeClass,
                  canGoPrevious
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50",
                )}
                style={
                  {
                    "--testimonial-nav-bg": navigationButtonColor,
                    "--testimonial-nav-bg-hover": navigationButtonHoverColor,
                    "--testimonial-nav-color": navigationIconColor,
                  } as React.CSSProperties
                }
              >
                <PreviousIcon
                  size={16}
                  weight="regular"
                  className="transition-opacity hover:opacity-70"
                />
              </button>
              <button
                type="button"
                aria-label="Next testimonial"
                onClick={goToNext}
                disabled={!canGoNext}
                className={cn(
                  "flex size-12 items-center justify-center bg-(--testimonial-nav-bg) text-(--testimonial-nav-color) transition-colors hover:bg-(--testimonial-nav-bg-hover)",
                  navigationShapeClass,
                  canGoNext
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50",
                )}
                style={
                  {
                    "--testimonial-nav-bg": navigationButtonColor,
                    "--testimonial-nav-bg-hover": navigationButtonHoverColor,
                    "--testimonial-nav-color": navigationIconColor,
                  } as React.CSSProperties
                }
              >
                <NextIcon
                  size={16}
                  weight="regular"
                  className="transition-opacity hover:opacity-70"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default TestimonialContent;

export let schema: HydrogenComponentSchema = {
  type: "testimonial--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "richtext",
          name: "description",
          label: "Description",
          defaultValue:
            "Beautiful dining set, the color is natural and the chairs very comfortable!",
          placeholder: "Pair large text with an image to tell a story.",
        },
        {
          type: "range",
          name: "ratting",
          label: "Reviews",
          defaultValue: 5,
          configs: {
            min: 1,
            max: 5,
            step: 1,
          },
        },
        {
          type: "text",
          name: "author",
          label: "Author name",
          defaultValue: "Stephanie L.",
          placeholder: "Name of the author",
        },
      ],
    },
    {
      group: "Heading (optional)",
      inputs: headingInputs.map((input) => {
        if (input.name === "content") {
          return {
            ...input,
            defaultValue: "TESTIMONIALS",
          };
        }
        if (input.name === "as") {
          return {
            ...input,
            name: "headingTagName",
          };
        }
        return input;
      }),
    },
    {
      group: "Subheading (Optional)",
      inputs: [
        {
          type: "select",
          name: "subHeadingTag",
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
          defaultValue: "h4",
        },
        {
          type: "color",
          name: "subHeadingColor",
          label: "Text color",
        },
        {
          type: "select",
          name: "subHeadingSize",
          label: "Text size",
          configs: {
            options: [
              { value: "base", label: "Base" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "large",
        },
        {
          type: "select",
          name: "subHeadingWeight",
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
          name: "subHeadingAlignment",
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
  ],
  presets: {
    content: "TESTIMONIALS",
    headingTagName: "h2",
    weight: "400",
    letterSpacing: "tight",
    alignment: "left",
    description:
      "Beautiful dining set, the color is natural and the chairs very comfortable!",
    ratting: 5,
    author: "Stephanie L.",
    subHeadingTag: "p",
    subHeadingSize: "large",
    subHeadingWeight: "normal",
    subHeadingColor: "#524B46",
    subHeadingAlignment: "left",
  },
};
