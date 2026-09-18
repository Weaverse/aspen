import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
  WeaverseImage,
} from "@weaverse/hydrogen";
import { IMAGES_PLACEHOLDERS, useTranslation } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Image } from "~/components/image";
import { cn } from "~/utils/cn";

interface HotspotsTestimonialProps extends HydrogenComponentProps {
  image: WeaverseImage | string;
  aspectRatio?: string;
}

let HotspotsTestimonial = forwardRef<HTMLDivElement, HotspotsTestimonialProps>(
  (props, ref) => {
    const { t } = useTranslation();

    let { image, aspectRatio, children, className, ...rest } = props;

    let imageData: Partial<WeaverseImage>;
    if (typeof image === "string") {
      imageData = { url: image, altText: t("accessibility.hotspotsImage") };
    } else if (image && typeof image === "object") {
      imageData = image;
    } else {
      imageData = {
        url: IMAGES_PLACEHOLDERS.collection_1,
        altText: t("accessibility.hotspotsImage"),
      };
    }

    return (
      <div
        ref={ref}
        {...rest}
        data-legacy-aspect-ratio={aspectRatio || undefined}
        className={cn(
          "relative order-1 aspect-[375/416] min-w-0 w-full overflow-hidden rounded-lg md:order-2 md:aspect-[10/9] md:h-auto lg:h-full",
          className,
        )}
      >
        {imageData.url && (
          <Image
            data={imageData}
            sizes="(min-width: 768px) 50vw, 100vw"
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
        iconSize: 34,
        offsetX: 12,
        offsetY: 42,
      },
      {
        type: "testimonial-hot--item",
        icon: "circle",
        iconSize: 34,
        offsetX: 58,
        offsetY: 24,
      },
      {
        type: "testimonial-hot--item",
        icon: "circle",
        iconSize: 34,
        offsetX: 67,
        offsetY: 63,
      },
    ],
  },
};
