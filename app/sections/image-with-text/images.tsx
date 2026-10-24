import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { Children, forwardRef, useEffect } from "react";
import { cn } from "~/utils/cn";
import type { ImageAspectRatioType } from "./context";
import { ImageSlotContext, useImageWithTextContext } from "./context";
import ImageWithTextImage from "./image";

interface ImageWithTextImageProps extends HydrogenComponentProps {
  imageAspectRatio: ImageAspectRatioType;
}

let ImageWithTextImages = forwardRef<HTMLDivElement, ImageWithTextImageProps>(
  (props, ref) => {
    let { imageAspectRatio, children, ...rest } = props;
    const {
      setImageCount,
      setImageAspectRatio,
      layout,
      isLegacyLayout,
      imageSettings,
    } = useImageWithTextContext();
    const legacyImages = Children.toArray(children).slice(0, 2);
    const slotCount =
      imageSettings[1].image !== undefined ? 2 : legacyImages.length || 2;
    const resolvedLayout = isLegacyLayout
      ? slotCount > 1
        ? "overlay"
        : "split"
      : layout;
    const count = resolvedLayout === "overlay" ? Math.min(slotCount, 2) : 1;
    // Providers add no DOM wrapper: saved child refs and Studio editing remain
    // intact, while parent controls override only explicitly saved fields.
    const images = Array.from({ length: count }, (_, index) => (
      <ImageSlotContext.Provider
        key={`image${index + 1}`}
        value={imageSettings[index]}
      >
        {legacyImages[index] ?? <ImageWithTextImage />}
      </ImageSlotContext.Provider>
    ));
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
            : "iwt-split-media order-(--iwt-mobile-media-order) aspect-square w-full shrink-0 [&>*]:h-full [&>*]:w-full md:order-(--iwt-media-order) md:aspect-auto md:h-full md:w-1/2",
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
  },
});
