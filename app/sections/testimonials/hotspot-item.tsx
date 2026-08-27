import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from "@weaverse/hydrogen";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Image } from "~/components/image";

interface HotspotsTestimonialProps extends HydrogenComponentProps {
  image: WeaverseImage | string;
  aspectRatio?: string;
}

let HotspotsTestimonial = forwardRef<HTMLDivElement, HotspotsTestimonialProps>(
  (props, ref) => {
    let { image, aspectRatio, children, ...rest } = props;

    let imageData: Partial<WeaverseImage>;
    if (typeof image === "string") {
      imageData = { url: image, altText: "Hotspots image" };
    } else if (image && typeof image === "object") {
      imageData = image;
    } else {
      imageData = {
        url: IMAGES_PLACEHOLDERS.collection_1,
        altText: "Hotspots image",
      };
    }

    return (
      <div
        ref={ref}
        {...rest}
        data-legacy-aspect-ratio={aspectRatio || undefined}
        className="relative order-1 w-full overflow-hidden rounded-lg aspect-[375/416] lg:order-2 lg:h-full lg:aspect-[10/9]"
      >
        {imageData.url && (
          <Image
            data={imageData}
            sizes="(min-width: 1024px) 720px, 100vw"
            className="z-0 h-full w-full object-cover"
            data-motion="zoom-in"
          />
        )}
        <div className="absolute inset-0 z-10">{children}</div>
      </div>
    );
  },
);

export default HotspotsTestimonial;

export let schema: HydrogenComponentSchema = {
  type: "testimonial--hotspots-item",
  title: "Hotspot",
  childTypes: ["testimonial-hot--item"],
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
    image: IMAGES_PLACEHOLDERS.collection_1,
    children: [
      {
        type: "testimonial-hot--item",
        icon: "circle",
        iconSize: 20,
        offsetX: 12,
        offsetY: 42,
      },
      {
        type: "testimonial-hot--item",
        icon: "circle",
        iconSize: 20,
        offsetX: 58,
        offsetY: 24,
      },
      {
        type: "testimonial-hot--item",
        icon: "circle",
        iconSize: 20,
        offsetX: 67,
        offsetY: 63,
      },
    ],
  },
};
