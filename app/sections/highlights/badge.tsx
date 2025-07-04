import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useState, useEffect } from "react";

export interface HighlightsBadgeProps extends HydrogenComponentProps {
  iconType?: string;
  customIcon?: string;
  badgeTextColor?: string;
}

let HighlightsBadge = forwardRef<HTMLDivElement, HighlightsBadgeProps & HydrogenComponentProps>(
  (props, ref) => {
    let { 
      children,
      iconType = "circle",
      customIcon = "",
      badgeTextColor = "#29231E",
      ...rest 
    } = props;
    const [imageError, setImageError] = useState(false);
    useEffect(() => {
      setImageError(false);
    }, [customIcon]);
    const isInlineSVG = (content: string) => {
      return content.trim().startsWith('<svg');
    };
    const renderIcon = (type: string) => {
      switch (type) {
        case "circle":
          return (
            <div 
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "square":
          return (
            <div 
              className="w-9 h-9 flex-shrink-0"
              style={{ backgroundColor: badgeTextColor }}
            />
          );
        case "triangle":
          return (
            <div 
              className="w-12 h-12 flex-shrink-0"
              style={{ 
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                backgroundColor: badgeTextColor 
              }}
            />
          );
        case "custom":
          if (!customIcon) {
            return (
              <div 
                className="w-12 h-12 flex-shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs"
              >
                No Icon
              </div>
            );
          }
          if (imageError && !isInlineSVG(customIcon)) {
            return (
              <div 
                className="w-12 h-12 border-2 border-dashed border-red-300 flex items-center justify-center text-red-400 text-xs flex-shrink-0"
              >
                Error
              </div>
            );
          }
          if (isInlineSVG(customIcon)) {
            const modifiedSVG = customIcon.replace(
              /fill="[^"]*"/g, 
              `fill="${badgeTextColor}"`
            );
            
            return (
              <div 
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: modifiedSVG }}
              />
            );
          }
          return (
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <img 
                src={customIcon}
                alt="Custom Icon"
                className="max-w-full max-h-full object-contain"
                style={{ 
                  filter: customIcon.toLowerCase().endsWith('.svg') ? 
                    `brightness(0) saturate(100%) invert(${badgeTextColor === '#29231E' ? '10%' : '90%'})` : 
                    'none'
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
        className={"flex flex-col items-center gap-0 px-4 py-8 md:gap-5 md:px-8 md:py-16"}
      >
        {renderIcon(iconType)}
        {children}
      </div>
    );
  },
);

export default HighlightsBadge;

export let schema = createSchema({
  type: "highlights-badge",
  title: "Highlights Badge",
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
          placeholder: "Paste SVG code or enter image URL (e.g., https://example.com/icon.svg)",
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
  ],
  childTypes: ["subheading", "paragraph"],
  presets: {
    iconType: "circle",
    badgeTextColor: "#29231E",
    children: [
      {
        type: "paragraph",
        content: "Quality furniture made to last through moves and milestones.",
        color: "#29231E",
      },
    ],
  },
}); 