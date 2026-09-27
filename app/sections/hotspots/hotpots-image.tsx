import type { HydrogenComponentProps, WeaverseImage } from "@weaverse/hydrogen";
import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useTranslation,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef } from "react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { calculateAspectRatio } from "~/utils/image";
import { useHotspotsContext } from "./hotpots";

interface HotspotsProps extends HydrogenComponentProps {
  image: string | WeaverseImage;
  aspectRatio?: ImageAspectRatio | "design";
}

let HotspotsImage = forwardRef<HTMLDivElement, HotspotsProps>((props, ref) => {
  const { t } = useTranslation();

  let { image, aspectRatio: localAspectRatio, children, ...rest } = props;

  const { aspectRatio: parentAspectRatio, layout } = useHotspotsContext();
  const finalAspectRatio = parentAspectRatio || localAspectRatio || "design";
  const usesDesignRatio = finalAspectRatio === "design";

  let imageData: Partial<WeaverseImage> =
    typeof image === "string"
      ? { url: image, altText: t("accessibility.hotspotsImage") }
      : image;

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(
        "relative w-full overflow-hidden",
        layout === "single"
          ? "aspect-video"
          : "rounded-(--radius-md) aspect-[335/417] md:aspect-[814/812]",
      )}
      style={
        usesDesignRatio
          ? undefined
          : {
              aspectRatio: calculateAspectRatio(
                imageData,
                finalAspectRatio as ImageAspectRatio,
              ),
            }
      }
    >
      <Image
        data={imageData}
        sizes="auto"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        data-motion="zoom-in"
      />
      {children}
    </div>
  );
});

export default HotspotsImage;

export let schema = createSchema({
  type: "hotspots-image",
  title: "Hotspots image",
  childTypes: ["hotspots--item"],
  limit: 2,
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
      ],
    },
  ],
  presets: {
    content: "Shop the look",
    image: IMAGES_PLACEHOLDERS.collection_1,
    gap: 40,
    children: [
      {
        type: "hotspots--item",
        iconSize: 34,
        offsetX: 25,
        offsetY: 30,
      },
      {
        type: "hotspots--item",
        iconSize: 34,
        offsetX: 55,
        offsetY: 65,
      },
    ],
  },
});
