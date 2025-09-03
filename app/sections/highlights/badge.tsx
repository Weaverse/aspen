import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useEffect, useState } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";

export interface HighlightsBadgeProps
  extends HydrogenComponentProps,
    Omit<HeadingProps, "content"> {
  iconType?: string;
  customIcon?: string;
  badgeTextColor?: string;
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

let HighlightsBadge = forwardRef<HTMLDivElement, HighlightsBadgeProps>(
  (props, ref) => {
    let {
      children,
      iconType = "circle",
      customIcon = "",
      badgeTextColor = "#29231E",
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
      ...rest
    } = props;
    const [imageError, setImageError] = useState(false);
    useEffect(() => {
      setImageError(false);
    }, [customIcon]);
    const isInlineSVG = (content: string) => {
      return content.trim().startsWith("<svg");
    };
    const renderIcon = (type: string) => {
      switch (type) {
        case "circle":
          return (
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "square":
          return (
            <div
              className="h-9 w-9 flex-shrink-0"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "triangle":
          return (
            <div
              className="h-12 w-12 flex-shrink-0"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                backgroundColor: badgeTextColor,
              }}
            />
          );
        case "custom":
          if (!customIcon) {
            return (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-gray-300 border-dashed text-gray-400 text-xs">
                No Icon
              </div>
            );
          }
          if (imageError && !isInlineSVG(customIcon)) {
            return (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-red-300 border-dashed text-red-400 text-xs">
                Error
              </div>
            );
          }
          if (isInlineSVG(customIcon)) {
            const modifiedSVG = customIcon.replace(
              /fill="[^"]*"/g,
              `fill="${badgeTextColor}"`,
            );

            return (
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center"
                dangerouslySetInnerHTML={{ __html: modifiedSVG }}
              />
            );
          }
          return (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
              <img
                src={customIcon}
                alt="Custom Icon"
                className="max-h-full max-w-full object-contain"
                style={{
                  filter: customIcon.toLowerCase().endsWith(".svg")
                    ? `brightness(0) saturate(100%) invert(${badgeTextColor === "#29231E" ? "10%" : "90%"})`
                    : "none",
                }}
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            </div>
          );
        default:
          return null;
      }
    };
    return (
      <div
        ref={ref}
        {...rest}
        className={
          "flex h-full flex-col items-center justify-center gap-0 px-4 py-8 md:gap-5 md:px-8 md:py-16"
        }
      >
        {/* Icon container với vị trí cố định */}
        <div className="flex w-full flex-shrink-0 items-center justify-center">
          {renderIcon(iconType)}
        </div>

        {/* Text container với vị trí cố định */}
        <div className="flex w-full flex-1 items-start justify-center text-center">
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
        </div>
      </div>
    );
  },
);

export default HighlightsBadge;

export let schema = createSchema({
  type: "highlights-badge",
  title: "Highlights Badge",
  limit: 3,
  settings: [
    {
      group: "Icon",
      inputs: [
        {
          type: "select",
          name: "iconType",
          label: "Icon Type",
          configs: {
            options: [
              { value: "circle", label: "Circle" },
              { value: "square", label: "Square" },
              { value: "triangle", label: "Triangle" },
              { value: "custom", label: "Custom Image" },
            ],
          },
          defaultValue: "circle",
        },
        {
          type: "textarea",
          name: "customIcon",
          label: "Custom Icon",
          placeholder:
            "Paste SVG code or enter image URL (e.g., https://example.com/icon.svg)",
          helpText: "Supports SVG code, image URLs (JPG, PNG, SVG files)",
          condition: "iconType.eq.custom",
        },
        {
          type: "color",
          name: "badgeTextColor",
          label: "Icon & Text Color",
          defaultValue: "#29231E",
          helpText: "For SVG icons, this will be used as the icon color",
        },
      ],
    },
    {
      group: "Heading",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue:
            "Quality furniture made to last through moves and milestones.",
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
  ],
  presets: {
    iconType: "circle",
    badgeTextColor: "#29231E",
    headingContent:
      "Quality furniture made to last through moves and milestones.",
    color: "#29231E",
  },
});
