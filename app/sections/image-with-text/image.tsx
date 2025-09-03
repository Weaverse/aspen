import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { useImageWithTextContext } from "./context";

const variants = cva("h-auto w-full", {
  variants: {
    objectFit: {
      cover: "object-cover",
      contain: "object-contain",
    },
    borderRadius: {
      0: "",
      2: "rounded-xs",
      4: "rounded-sm",
      6: "rounded-md",
      8: "rounded-lg",
      10: "rounded-[10px]",
      12: "rounded-xl",
      14: "rounded-[14px]",
      16: "rounded-2xl",
      18: "rounded-[18px]",
      20: "rounded-[20px]",
      22: "rounded-[22px]",
      24: "rounded-3xl",
      26: "rounded-[26px]",
      28: "rounded-[28px]",
      30: "rounded-[30px]",
      32: "rounded-[32px]",
      34: "rounded-[34px]",
      36: "rounded-[36px]",
      38: "rounded-[38px]",
      40: "rounded-[40px]",
    },
  },
});

interface ImageWithTextImageProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  image: WeaverseImage | string;
  imageAspectRatio?: ImageAspectRatio;
}

const ImageWithTextImage = forwardRef<HTMLDivElement, ImageWithTextImageProps>(
  (props, ref) => {
    const {
      image = IMAGES_PLACEHOLDERS.image,
      borderRadius,
      objectFit,
      imageAspectRatio: propAspectRatio,
      ...rest
    } = props;
    const { imageAspectRatio: contextAspectRatio } = useImageWithTextContext();
    const finalAspectRatio = propAspectRatio || contextAspectRatio;
    const imageData: Partial<WeaverseImage> =
      typeof image === "string"
        ? { url: image, altText: "Placeholder" }
        : image;

    let aspRt: string | undefined;
    if (finalAspectRatio === "adapt") {
      if (imageData.width && imageData.height) {
        aspRt = `${imageData.width}/${imageData.height}`;
      }
    } else {
      aspRt = finalAspectRatio;
    }

    return (
      <Image
        ref={ref}
        {...rest}
        data={imageData}
        data-motion="slide-in"
        sizes="auto"
        aspectRatio={aspRt}
        className={cn("h-auto w-full", variants({ objectFit, borderRadius }))}
        data-aspect-ratio={finalAspectRatio}
      />
    );
  },
);

export default ImageWithTextImage;

export const schema = createSchema({
  type: "image-with-text--image",
  title: "Image",
  limit: 2,
  settings: [
    {
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
        {
          type: "select",
          name: "objectFit",
          label: "Object fit",
          defaultValue: "cover",
          configs: {
            options: [
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ],
          },
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
    objectFit: "cover",
    borderRadius: 0,
  },
});
