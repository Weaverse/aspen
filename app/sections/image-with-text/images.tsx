import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { Children, forwardRef, useEffect } from "react";
import { cn } from "~/utils/cn";
import type { ImageAspectRatioType } from "./context";
import { useImageWithTextContext } from "./context";

interface ImageWithTextImageProps extends HydrogenComponentProps {
  imageAspectRatio: ImageAspectRatioType;
}

let ImageWithTextImages = forwardRef<HTMLDivElement, ImageWithTextImageProps>(
  (props, ref) => {
    let { imageAspectRatio, children, ...rest } = props;
    const { setImageCount, setImageAspectRatio, layout, isLegacyLayout } =
      useImageWithTextContext();
    const childCount = Children.count(children);
    const resolvedLayout = isLegacyLayout
      ? childCount > 1
        ? "overlay"
        : "split"
      : layout;
    const images = Children.toArray(children).slice(
      0,
      resolvedLayout === "overlay" ? 2 : 1,
    );
    const imageCount = images.length;

    useEffect(() => {
      setImageCount(imageCount);
      setImageAspectRatio(imageAspectRatio);
    }, [imageCount, setImageCount, imageAspectRatio, setImageAspectRatio]);

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "flex h-full w-full",
          resolvedLayout === "overlay"
            ? "flex-row [&>*]:min-w-0 [&>*]:flex-1"
            : "h-[430px] shrink-0 items-center md:h-full md:w-1/2 md:py-10",
        )}
      >
        {images}
      </div>
    );
  },
);

export default ImageWithTextImages;

export let schema = createSchema({
  type: "image-with-text--images",
  title: "Images",
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
    children: [
      { type: "image-with-text--image", aspectRatio: "1/1" },
      { type: "image-with-text--image", aspectRatio: "1/1" },
    ],
  },
});
