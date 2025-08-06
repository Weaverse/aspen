import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { useImageWithTextContext } from "./context";
import { cn } from "~/utils/cn";

const variants = cva(
  "grow flex flex-col py-6 px-4 md:px-8 md:py-8 [&_.paragraph]:mx-[unset] [&_.paragraph]:w-auto",
  {
    variants: {
      gap: {
        "0": "gap-0",
        "1": "gap-1",
        "2": "gap-2",
        "3": "gap-3",
        "4": "gap-4",
        "5": "gap-5",
        "6": "gap-6",
        "8": "gap-8",
        "10": "gap-10",
        "12": "gap-12",
        "16": "gap-16",
        "20": "gap-20",
      },
      contentPosition: {
        "top left": "justify-start items-start [&_.paragraph]:text-left",
        "top center": "justify-start items-center [&_.paragraph]:text-center",
        "top right": "justify-start items-end [&_.paragraph]:text-right",
        "center left": "justify-center items-start [&_.paragraph]:text-left",
        "center center": "justify-center items-center [&_.paragraph]:text-center",
        "center right": "justify-center items-end [&_.paragraph]:text-right",
        "bottom left": "justify-end items-start [&_.paragraph]:text-left",
        "bottom center": "justify-end items-center [&_.paragraph]:text-center",
        "bottom right": "justify-end items-end [&_.paragraph]:text-right",
      },
    },
    defaultVariants: {
      gap: "5",
      contentPosition: "center center",
    },
  }
);

interface ImageWithTextContentProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {}

const ImageWithTextContent = forwardRef<
  HTMLDivElement,
  ImageWithTextContentProps
>((props, ref) => {
  const { gap, contentPosition, children, ...rest } = props;
  const { imageCount } = useImageWithTextContext();

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        variants({ gap, contentPosition }),
        imageCount > 1 &&
          "absolute inset-0 flex z-1 w-full",
        imageCount <= 1 && "md:w-1/2 w-full aspect-square"
      )}
      data-content-with-images={imageCount}
    >
      {children}
    </div>
  );
});

export default ImageWithTextContent;

export const schema = createSchema({
  type: "image-with-text--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "gap",
          label: "Gap",
          configs: {
            options: [
              { value: "0", label: "None" },
              { value: "1", label: "Extra Small" },
              { value: "2", label: "Small" },
              { value: "3", label: "Small+" },
              { value: "4", label: "Medium-" },
              { value: "5", label: "Medium" },
              { value: "6", label: "Medium+" },
              { value: "8", label: "Large" },
              { value: "10", label: "Extra Large" },
              { value: "12", label: "XXL" },
              { value: "16", label: "XXXL" },
              { value: "20", label: "Huge" },
            ],
          },
          helpText: "Control the spacing between child elements.",
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    gap: "5",
    contentPosition: "center center",
    children: [
      {
        type: "subheading",
        content: "Subheading",
      },
      {
        type: "heading",
        content: "Heading for image",
      },
      {
        type: "paragraph",
        content: "Pair large text with an image to tell a story.",
      },
      {
        type: "button",
        text: "Shop now",
      },
    ],
  },
});
