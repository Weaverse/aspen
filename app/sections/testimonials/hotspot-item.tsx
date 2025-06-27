import type {
    HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from "@weaverse/hydrogen";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { getImageAspectRatio } from "~/utils/image";

interface HotspotsTestimonialProps extends HydrogenComponentProps {
  image: string;
  aspectRatio: ImageAspectRatio;
}

let HotspotsTestimonial = forwardRef<HTMLDivElement, HotspotsTestimonialProps>(
  (props, ref) => {
    let { image, aspectRatio, children, ...rest } = props;
    let imageData: Partial<WeaverseImage> =
      typeof image === "string"
        ? { url: image, altText: "Hotspots image" }
        : image;

    return (
      <div
        ref={ref}
        {...rest}
        className="relative h-full w-full overflow-hidden"
        style={{ aspectRatio: getImageAspectRatio(imageData, aspectRatio) }}
      >
        <Image
          data={imageData}
          sizes="auto"
          className="z-0 h-full w-full object-cover"
          data-motion="zoom-in"
        />
        <div className="absolute inset-0 z-10">
          {children}
        </div>
      </div>
    );
  }
);

export default HotspotsTestimonial;

export let schema: HydrogenComponentSchema = {
  type: "testimonial--hotspots-item",
  title: "Hotspot",
  childTypes: ["testimonial-hot--item"],
  inspector: [
    {
      group: "Layout",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
        {
          type: "select",
          name: "aspectRatio",
          label: "Aspect ratio",
          defaultValue: "adapt",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.collection_1,
    aspectRatio: "1/1",
    children: [
      {
        type: "testimonial-hot--item",
        offsetX: 25,
        offsetY: 30,
      },
      {
        type: "testimonial-hot--item",
        offsetX: 55,
        offsetY: 65,
      },
    ],
  },
};
