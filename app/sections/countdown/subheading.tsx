import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";

const variants = cva("subheading self-start", {
  variants: {
    size: {
      base: "text-base",
      large: "text-lg",
      "2xl": "text-2xl",
    },
    alignment: {
      left: "flex justify-start text-left",
      center: "flex justify-center text-center",
      right: "flex justify-end text-right",
    },
  },
  defaultVariants: {
    size: "2xl",
    alignment: "center",
  },
});

interface SubHeadingProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  as?: "h4" | "h5" | "h6" | "div" | "p";
  color?: string;
  backgroundColor?: string;
  backgroundBorderRadius?: number;
  weight?: "normal" | "medium" | null;
  content: string;
}

const SubHeading = forwardRef<
  HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement,
  SubHeadingProps
>((props, ref) => {
  const translateText = useTranslatedText();

  const {
    as: Tag = "p",
    content: rawI18nContent,
    color,
    backgroundColor,
    backgroundBorderRadius,
    size,
    weight = "normal",
    alignment,
    className,
    ...rest
  } = props;
  const content = translateText(
    rawI18nContent,
    "themeContent.sectionsCountdownSubheading.content",
  );
  return (
    <div
      ref={ref}
      {...rest}
      data-motion="fade-up"
      className={cn(variants({ size, alignment, className }))}
    >
      <Tag
        style={{
          color,
          backgroundColor,
          borderRadius: backgroundColor
            ? typeof backgroundBorderRadius === "number"
              ? `${backgroundBorderRadius}px`
              : "var(--radius-sm)"
            : undefined,
        }}
        className={cn(
          "mb-0 w-fit font-heading",
          weight === "medium" ? "font-medium" : "font-normal",
          backgroundColor && "inline-flex items-center px-4 py-0.5 lg:py-0",
        )}
      >
        {content}
      </Tag>
    </div>
  );
});

export default SubHeading;

export const schema = createSchema({
  type: "subheading--countdown",
  title: "Subheading",
  settings: [
    {
      group: "Subheading",
      inputs: [
        {
          type: "select",
          name: "as",
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
          type: "text",
          name: "content",
          label: "Content",
          defaultValue: "Section subheading",
          placeholder: "Section subheading",
        },
        {
          type: "color",
          name: "color",
          label: "Text color",
        },
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
        },
        {
          type: "range",
          name: "backgroundBorderRadius",
          label: "Background border radius",
          configs: {
            min: 0,
            max: 40,
            step: 1,
            unit: "px",
          },
          defaultValue: 8,
          condition: (data: SubHeadingProps) => Boolean(data.backgroundColor),
        },
        {
          type: "select",
          name: "size",
          label: "Text size",
          configs: {
            options: [
              { value: "base", label: "Base" },
              { value: "large", label: "Large" },
              { value: "2xl", label: "2x large" },
            ],
          },
          defaultValue: "2xl",
        },
        {
          type: "select",
          name: "weight",
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
          name: "alignment",
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
          defaultValue: "center",
        },
      ],
    },
  ],
});
