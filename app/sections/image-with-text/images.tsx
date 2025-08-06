import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, Children, useEffect } from "react";
import { useImageWithTextContext } from "./context";
import type { ImageAspectRatioType } from "./context";
import { cn } from "~/utils/cn";

interface ImageWithTextImageProps extends HydrogenComponentProps {
  imageAspectRatio: ImageAspectRatioType;
}

let ImageWithTextImages = forwardRef<HTMLDivElement, ImageWithTextImageProps>(
  (props, ref) => {
    let { imageAspectRatio, children, ...rest } = props;
    const { setImageCount, setImageAspectRatio } = useImageWithTextContext();
    const imageCount = Children.count(children);
    
    useEffect(() => {
      setImageCount(imageCount);
      setImageAspectRatio(imageAspectRatio);
    }, [imageCount, setImageCount, imageAspectRatio, setImageAspectRatio]);

    return (
      <div
        ref={ref}
        {...rest}
        className={cn("w-full h-full flex", imageCount  <= 1 ? "md:w-1/2 w-full aspect-square" : "")}
      >
        {children}
      </div>
    );
  }
);

export default ImageWithTextImages;

export let schema = createSchema({
  type: "image-with-text--images",
  title: "Image",
  limit: 1,
  childTypes: ["image-with-text--image"],
  settings: [
    {
      group: "Image",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          defaultValue: "1/1",
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
      ],
    },
  ],
  presets: {
    imageAspectRatio: "1/1",
    children: [{ type: "image-with-text--image", aspectRatio: "1/1" }],
  },
});
