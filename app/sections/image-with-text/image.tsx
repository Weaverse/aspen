import {
  type BasicInput,
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useTranslation,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { type CSSProperties, forwardRef, useContext } from "react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { sectionImage } from "~/utils/section-placeholder";
import { ImageSlotContext, useImageWithTextContext } from "./context";

const variants = cva("h-auto w-full", {
  variants: {
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

export interface ImageWithTextImageProps
  extends VariantProps<typeof variants>,
    Partial<HydrogenComponentProps> {
  image?: WeaverseImage | string;
  imageAspectRatio?: ImageAspectRatio;
  objectFit?: "cover" | "contain" | null;
  style?: CSSProperties;
}

const ImageWithTextImage = forwardRef<HTMLDivElement, ImageWithTextImageProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const overrides = useContext(ImageSlotContext);

    const {
      image: savedImage,
      borderRadius: savedBorderRadius,
      objectFit: savedObjectFit,
      imageAspectRatio: propAspectRatio,
      style,
      ...rest
    } = props;
    const image = overrides.image !== undefined ? overrides.image : savedImage;
    const borderRadius =
      overrides.borderRadius !== undefined
        ? overrides.borderRadius
        : savedBorderRadius;
    const objectFit =
      overrides.objectFit !== undefined ? overrides.objectFit : savedObjectFit;
    const {
      imageAspectRatio: contextAspectRatio,
      layout,
      isLegacyLayout,
    } = useImageWithTextContext();
    const finalAspectRatio = propAspectRatio || contextAspectRatio;
    const imageData = sectionImage(
      image,
      IMAGES_PLACEHOLDERS.image,
      t("accessibility.imagePlaceholder"),
    );

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
        aspectRatio={isLegacyLayout ? aspRt : undefined}
        style={{ ...style, objectFit: objectFit ?? style?.objectFit }}
        className={cn(
          "h-full w-full",
          layout === "overlay" && "min-w-0 flex-1",
          variants({ borderRadius }),
          "max-md:rounded-[var(--iwt-mobile-image-radius,0px)]",
        )}
        data-aspect-ratio={finalAspectRatio}
      />
    );
  },
);

export default ImageWithTextImage;

export const imageInputs: BasicInput[] = [
  { type: "image", name: "image", label: "Image" },
  {
    type: "range",
    name: "borderRadius",
    label: "Border radius on desktop and tablet",
    configs: { min: 0, max: 40, step: 2, unit: "px" },
    defaultValue: 0,
    helpText:
      "Style 2 keeps corners touching the section edge square. Set the mobile image radius on the parent section.",
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
];

export const schema = createSchema({
  type: "image-with-text--image",
  title: "Image",
  limit: 2,
  // Keep the type registered for saved documents, but use parent image controls
  // for new sections instead of adding more child image items.
  enabled: false,
  settings: [
    {
      group: "Legacy image",
      inputs: imageInputs.map((input) => ({
        ...input,
        helpText: [
          input.helpText,
          "The parent section's Images settings take priority when set. Edit this legacy field only when there is no parent override for it. Style 2 only displays the first image.",
        ]
          .filter(Boolean)
          .join(" "),
      })),
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
    objectFit: "cover",
    borderRadius: 0,
  },
});
