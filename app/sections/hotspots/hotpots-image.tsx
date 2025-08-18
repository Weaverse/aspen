import type { HydrogenComponentProps, WeaverseImage } from "@weaverse/hydrogen";
import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { calculateAspectRatio } from "~/utils/image";
import { useHotspotsContext } from "./hotpots";

interface HotspotsProps
  extends HydrogenComponentProps {
  image: string;
  aspectRatio?: ImageAspectRatio;
}

let HotspotsImage = forwardRef<HTMLDivElement, HotspotsProps>((props, ref) => {
  let {
    image,
    aspectRatio: localAspectRatio,
    children,
    ...rest
  } = props;

  const { aspectRatio: parentAspectRatio } = useHotspotsContext();
  const finalAspectRatio = parentAspectRatio || localAspectRatio || "adapt";

  let imageData: Partial<WeaverseImage> =
    typeof image === "string"
      ? { url: image, altText: "Hotspots image" }
      : image;

  return (
      <div ref={ref} {...rest}
        className="relative w-full"
        style={{ aspectRatio: calculateAspectRatio(imageData, finalAspectRatio) }}
      >
        <Image
          data={imageData}
          sizes="auto"
          className="z-0"
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
        offsetX: 25,
        offsetY: 30,
      },
      {
        type: "hotspots--item",
        offsetX: 55,
        offsetY: 65,
      },
    ],
  },
});
