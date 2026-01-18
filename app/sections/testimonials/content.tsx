import { Quotes, Star } from "@phosphor-icons/react";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useMemo } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import { IconArrowLeft, IconArrowRight } from "~/components/icons";

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
  // Arrows props
  arrowsColor?: "primary" | "secondary";
  arrowsShape?: "circle" | "square" | "rounded-sm";
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
      content,
      description,
      ratting,
      author,
      // Description styling props
      subHeadingTag = "h4",
      subHeadingSize = "large",
      subHeadingWeight = "normal",
      subHeadingColor = "#4B5563",
      subHeadingAlignment = "left",
      // Arrows props
      arrowsColor = "primary",
      arrowsShape = "circle",
      children,
      ...rest
    } = props;

    // Generate dynamic classes for description text
    const descriptionClasses = [
      `text-${subHeadingAlignment}`,
      subHeadingSize === "large" ? "text-lg" : "text-base",
      subHeadingWeight === "medium" ? "font-medium" : "font-normal",
    ].join(" ");

    // Create the description element based on the selected tag
    const DescriptionTag = subHeadingTag;

    const handlePrevSlide = () => {
      if (window.testimonialSwiper) {
        window.testimonialSwiper.slidePrev();
      }
    };

    const handleNextSlide = () => {
      if (window.testimonialSwiper) {
        window.testimonialSwiper.slideNext();
      }
    };

    const arrowColorClasses = useMemo(() => {
      return arrowsColor === "secondary"
        ? [
          "text-(--btn-secondary-text)",
          "bg-(--btn-secondary-bg)",
          "border-(--btn-secondary-bg)",
          "hover:text-(--btn-secondary-text)",
          "hover:bg-(--btn-secondary-bg)",
          "hover:border-(--btn-secondary-bg)",
        ]
        : [
          "text-(--btn-primary-text)",
          "bg-(--btn-primary-bg)",
          "border-(--btn-primary-bg)",
          "hover:text-(--btn-primary-text)",
          "hover:bg-(--btn-primary-bg)",
          "hover:border-(--btn-primary-bg)",
        ];
    }, [arrowsColor]);

    const arrowShapeClasses = useMemo(() => {
      if (arrowsShape === "circle") {
        return "rounded-full";
      }
      if (arrowsShape === "square") {
        return "";
      }
      return "rounded-md";
    }, [arrowsShape]);

    const renderStars = () => {
      const stars = [];
      for (let i = 0; i < ratting; i++) {
        stars.push(<Star size={24} weight="fill" fill="#918379" key={i} />);
      }
      return stars;
    };
    return (
      <div
        ref={ref}
        {...rest}
        className="flex flex-1 flex-col justify-center gap-5"
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
            className="h-1/2"
          />
        )}
        <div className="flex h-1/2 flex-col justify-end gap-16">
          <div className="flex flex-col gap-5">
            <Quotes size={32} className="rotate-180" />
            {description && (
              <DescriptionTag
                className={`testimonial-description ${descriptionClasses}`}
                style={{ color: subHeadingColor }}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-4">
              <span className="flex gap-0.5">{renderStars()}</span>
              <p className="text-base">{author}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevSlide}
                className={clsx(
                  "h-fit w-fit cursor-pointer border p-4 transition-colors duration-300",
                  arrowColorClasses,
                  arrowShapeClasses
                )}
              >
                <IconArrowLeft className="" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className={clsx(
                  "h-fit w-fit cursor-pointer border p-4 transition-colors duration-300",
                  arrowColorClasses,
                  arrowShapeClasses
                )}
              >
                <IconArrowRight className="" />
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
          defaultValue: 3,
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
    {
      group: "Arrows",
      inputs: [
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "arrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
        },
      ],
    },
  ],
};
