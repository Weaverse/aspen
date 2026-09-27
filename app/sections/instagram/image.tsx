import { Image as ImageIcon, InstagramLogo } from "@phosphor-icons/react";
import {
  createSchema,
  type HydrogenComponentProps,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { Link as RemixLink } from "react-router";
import { Image } from "~/components/image";
import { useHrefWithLocale } from "~/components/link";

interface InstagramImageProps extends HydrogenComponentProps {
  image?: WeaverseImage | string;
  altText?: string;
  to?: string;
  openInNewTab?: boolean;
}

const InstagramImage = forwardRef<HTMLDivElement, InstagramImageProps>(
  (props, ref) => {
    const { image, altText, to, openInNewTab, ...rest } = props;
    const href = useHrefWithLocale(to);
    const imageData =
      typeof image === "string"
        ? { url: image, altText }
        : image
          ? { ...image, altText: altText || image.altText }
          : null;

    const content = (
      <>
        {imageData?.url ? (
          <Image
            data={imageData}
            alt={imageData.altText || ""}
            className="h-full w-full"
            sizes="(min-width: 64rem) 260px, (min-width: 48rem) 22vw, calc((100vw - 48px) / 2)"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#EBE8E5]">
            <ImageIcon
              aria-hidden="true"
              className="size-[50px] text-[#524B46] opacity-60"
            />
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100" />
        <InstagramLogo className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-1 size-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100" />
      </>
    );

    return (
      <div
        ref={ref}
        {...rest}
        className="instagram-tile group relative aspect-square w-full overflow-hidden rounded-[var(--Radius-border-radius-md,12px)] bg-white"
      >
        {to ? (
          <RemixLink
            to={href || to}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noreferrer" : undefined}
            className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-current"
          >
            {content}
          </RemixLink>
        ) : (
          content
        )}
      </div>
    );
  },
);

export default InstagramImage;

export const schema = createSchema({
  type: "instagram--image",
  title: "Instagram image",
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
          type: "text",
          name: "altText",
          label: "Alt text",
          helpText:
            "Describe the image for customers who use screen readers. The image alt text from Shopify is used when this field is empty.",
        },
        {
          type: "url",
          name: "to",
          label: "Link to",
          placeholder: "/collections/all",
        },
        {
          type: "switch",
          name: "openInNewTab",
          label: "Open in new tab",
          defaultValue: false,
          condition: (data: InstagramImageProps) => Boolean(data.to),
        },
      ],
    },
  ],
  presets: {},
});
