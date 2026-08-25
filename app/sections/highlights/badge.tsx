import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import { forwardRef, useEffect, useState } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link from "~/components/link";

export interface HighlightsBadgeProps
  extends HydrogenComponentProps,
    Omit<HeadingProps, "content"> {
  iconType?: string;
  showIcon?: boolean;
  customIcon?: string;
  badgeTextColor?: string;
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  description?: string;
  linkText?: string;
  linkTo?: string;
}

let HighlightsBadge = forwardRef<HTMLDivElement, HighlightsBadgeProps>(
  (props, ref) => {
    const { t } = useTranslation();
    let {
      children,
      iconType = "circle",
      showIcon = true,
      customIcon = "",
      badgeTextColor = "#29231E",
      // Heading props
      headingContent,
      headingTagName,
      description,
      linkText,
      linkTo,
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
    }, []);
    const isInlineSVG = (content: string) => {
      return content.trim().startsWith("<svg");
    };
    const renderIcon = (type: string) => {
      switch (type) {
        case "circle":
          return (
            <div
              className="size-5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "square":
          return (
            <div
              className="size-5 flex-shrink-0"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "triangle":
          return (
            <div
              className="h-5 w-6 flex-shrink-0"
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
                {t("system.noIcon")}
              </div>
            );
          }
          if (imageError && !isInlineSVG(customIcon)) {
            return (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-red-300 border-dashed text-red-400 text-xs">
                {t("system.error")}
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
              {/* biome-ignore lint/performance/noImgElement: Custom icons can be arbitrary external URLs or data URIs rather than Shopify image data. */}
              <img
                src={customIcon}
                alt={t("accessibility.customIcon")}
                width={48}
                height={48}
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
        className="flex min-h-[320px] flex-col items-center justify-center px-5 py-10 md:min-h-[322px] md:px-10"
      >
        {showIcon && (
          <div className="mb-6 flex w-full flex-shrink-0 items-center justify-center">
            {renderIcon(iconType)}
          </div>
        )}

        <div className="flex w-full justify-center text-center">
          {headingContent ? (
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
              className="max-w-[300px] text-xl leading-[1.1] tracking-[-0.02em] md:text-[26px]"
            />
          ) : (
            children
          )}
        </div>
        {description && (
          <p className="mt-4 max-w-[290px] text-center text-[11px] leading-snug opacity-65 md:text-xs">
            {description}
          </p>
        )}
        {linkText && (
          <Link
            to={linkTo || "#"}
            className="mt-5 inline-flex items-center gap-1 text-[10px] underline underline-offset-2"
          >
            {linkText}
            <span aria-hidden="true">→</span>
          </Link>
        )}
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
          type: "switch",
          name: "showIcon",
          label: "Show icon",
          defaultValue: true,
        },
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
          condition: (data: HighlightsBadgeProps) => data.showIcon,
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
    {
      group: "Supporting content",
      inputs: [
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue: "Built with durable materials for years of daily use.",
        },
        {
          type: "text",
          name: "linkText",
          label: "Link text",
          defaultValue: "Explore More",
        },
        {
          type: "url",
          name: "linkTo",
          label: "Link to",
          defaultValue: "/collections/all",
          condition: "linkText.ne.empty",
        },
      ],
    },
  ],
  presets: {
    iconType: "circle",
    showIcon: true,
    badgeTextColor: "#29231E",
    headingContent:
      "Quality furniture made to last through moves and milestones.",
    color: "#29231E",
    description: "Built with durable materials for years of daily use.",
    linkText: "Explore More",
    linkTo: "/collections/all",
  },
});
