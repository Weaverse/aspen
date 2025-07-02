import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { useImageWithTextContext } from "./context";
import { cn } from "~/utils/cn";

const variants = cva(
  "grow flex flex-col justify-center gap-5 py-6 px-4 md:px-8 md:py-8 [&_.paragraph]:mx-[unset] [&_.paragraph]:w-auto",
  {
    variants: {
      alignment: {
        left: "items-start",
        center: "items-center",
        right: "items-end",
      },
    },
    defaultVariants: {
      alignment: "center",
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
  const { alignment, children, ...rest } = props;
  const { imageCount } = useImageWithTextContext();

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        variants({ alignment }),
        imageCount > 1 &&
          "absolute inset-0 flex items-center justify-center z-1",
        imageCount <= 1 && "flex-1"
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
          name: "alignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          },
          helpText:
            "This will override the default alignment setting of all children components.",
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    alignment: "center",
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
