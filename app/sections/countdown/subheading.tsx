import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "~/utils/cn";

const variants = cva("subheading", {
  variants: {
    size: {
      base: "text-base",
      large: "text-lg",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
    },
    alignment: {
      left: "flex justify-start text-left",
      center: "flex justify-center text-center",
      right: "flex justify-end text-right",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
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
  content: string;
}

const SubHeading = forwardRef<
  HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement,
  SubHeadingProps
>((props, ref) => {
  const {
    as: Tag = "p",
    content,
    color,
    backgroundColor,
    backgroundBorderRadius = 0,
    size,
    weight,
    alignment,
    className,
    ...rest
  } = props;
  return (
    <div
      ref={ref}
      {...rest}
      data-motion="fade-up"
      className={cn(variants({ size, weight, alignment, className }))}
    >
      <Tag
        style={{
          color,
          backgroundColor,
          borderRadius: backgroundColor
            ? `${backgroundBorderRadius}px`
            : undefined,
        }}
        className={cn("mb-0 h-full w-fit", backgroundColor && "px-4 py-0.5")}
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
          defaultValue: 0,
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
            ],
          },
          defaultValue: "base",
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
