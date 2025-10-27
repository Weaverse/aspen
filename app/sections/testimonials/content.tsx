import { ArrowLeft, ArrowRight, Quotes, Star } from "@phosphor-icons/react";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";

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
              >
                {description}
              </DescriptionTag>
            )}
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-4">
              <span className="flex gap-0.5">{renderStars()}</span>
              <p className="text-base">{author}</p>
            </div>
            <div className="flex gap-2">
              <span
                onClick={handlePrevSlide}
                className="h-fit w-fit cursor-pointer rounded-full bg-[#EDEAE6] p-4"
              >
                <ArrowLeft
                  size={16}
                  weight="thin"
                  className="transition-opacity hover:opacity-70"
                />
              </span>
              <span
                onClick={handleNextSlide}
                className="h-fit w-fit cursor-pointer rounded-full bg-[#EDEAE6] p-4"
              >
                <ArrowRight
                  size={16}
                  weight="thin"
                  className="transition-opacity hover:opacity-70"
                />
              </span>
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
  inspector: [
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
  ],
};
