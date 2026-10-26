import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { sectionBackgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";
import {
  type ImageAspectRatioType,
  type ImageSettings,
  ImageWithTextContext,
  type ImageWithTextLayout,
} from "./context";
import { imageInputs } from "./image";

interface ImageWithTextProps extends SectionProps {
  layout?: ImageWithTextLayout;
  mediaPosition?: "left" | "right";
  mobileMediaPosition?: "top" | "bottom";
  mobileImageRadius?: number;
  showVerticalSpacing?: boolean;
  image1?: ImageSettings["image"];
  image2?: ImageSettings["image"];
  image1BorderRadius?: ImageSettings["borderRadius"];
  image2BorderRadius?: ImageSettings["borderRadius"];
  image1ObjectFit?: ImageSettings["objectFit"];
  image2ObjectFit?: ImageSettings["objectFit"];
}

const DEFAULT_BACKGROUND_COLOR = "#DBDBDB";

const ImageWithText = forwardRef<HTMLElement, ImageWithTextProps>(
  (props, ref) => {
    const {
      children,
      className,
      layout,
      mediaPosition = "right",
      mobileMediaPosition = "top",
      mobileImageRadius = 0,
      showVerticalSpacing = true,
      backgroundColor,
      image1,
      image2,
      image1BorderRadius,
      image2BorderRadius,
      image1ObjectFit,
      image2ObjectFit,
      ...rest
    } = props;

    const [imageCount, setImageCount] = useState(0);
    const [imageAspectRatio, setImageAspectRatio] =
      useState<ImageAspectRatioType>("1/1");
    const resolvedLayout = layout ?? (imageCount > 1 ? "overlay" : "split");
    const isLegacyLayout = layout === undefined;
    const isOverlay = resolvedLayout === "overlay";

    return (
      <ImageWithTextContext.Provider
        value={{
          imageCount,
          setImageCount,
          imageAspectRatio,
          setImageAspectRatio,
          layout: resolvedLayout,
          isLegacyLayout,
          imageSettings: [
            {
              image: image1,
              borderRadius: image1BorderRadius,
              objectFit: image1ObjectFit,
            },
            {
              image: image2,
              borderRadius: image2BorderRadius,
              objectFit: image2ObjectFit,
            },
          ],
        }}
      >
        <Section
          ref={ref}
          {...rest}
          className={cn(
            "overflow-x-clip",
            !isOverlay &&
              (mediaPosition === "right"
                ? "md:[&_.iwt-split-media>*]:rounded-r-none"
                : "md:[&_.iwt-split-media>*]:rounded-l-none"),
            className,
          )}
          style={
            {
              ...props.style,
              "--iwt-vertical-spacing": showVerticalSpacing ? "40px" : "0px",
              "--iwt-media-order": mediaPosition === "left" ? -1 : 1,
              "--iwt-mobile-media-order":
                mobileMediaPosition === "top" ? -1 : 1,
              "--iwt-mobile-image-radius": `${mobileImageRadius}px`,
            } as React.CSSProperties
          }
          containerClassName={cn(
            "px-0 sm:px-0",
            isOverlay
              ? "relative flex h-[417px] flex-row md:h-[960px]"
              : "iwt-split-row flex flex-col md:h-auto md:flex-row md:py-10 lg:h-[944px]",
          )}
          data-media-position={!isOverlay ? mediaPosition : undefined}
          backgroundColor={backgroundColor || DEFAULT_BACKGROUND_COLOR}
          backgroundFor="section"
          gap={0}
          overflow="unset"
          verticalPadding="none"
          width="full"
        >
          {children}
        </Section>
      </ImageWithTextContext.Provider>
    );
  },
);

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image with text",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Section layout",
          configs: {
            options: [
              {
                value: "overlay",
                label: "Style 1",
              },
              { value: "split", label: "Style 2" },
            ],
          },
          defaultValue: "overlay",
        },
        {
          type: "switch",
          name: "showVerticalSpacing",
          label: "Show top and bottom spacing",
          defaultValue: true,
          condition: (data: ImageWithTextProps) => data.layout === "split",
        },
        {
          type: "toggle-group",
          name: "mediaPosition",
          label: "Image position on desktop and tablet",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ],
          },
          defaultValue: "right",
          condition: (data: ImageWithTextProps) => data.layout === "split",
        },
        {
          type: "toggle-group",
          name: "mobileMediaPosition",
          label: "Image position on mobile",
          configs: {
            options: [
              { value: "top", label: "Image first" },
              { value: "bottom", label: "Content first" },
            ],
          },
          defaultValue: "top",
          condition: (data: ImageWithTextProps) => data.layout === "split",
        },
        {
          type: "range",
          name: "mobileImageRadius",
          label: "Image corner radius on mobile",
          configs: { min: 0, max: 40, step: 2, unit: "px" },
          defaultValue: 0,
          helpText:
            "Use 0 for square corners. Desktop and tablet use the image block's radius; corners touching the section's left or right edge stay square in Style 2.",
        },
      ],
    },
    {
      group: "Images",
      // Defaults must not mask images or styling saved on legacy children.
      // New sections receive their defaults through presets instead.
      inputs: ([1, 2] as const).flatMap((slot) =>
        imageInputs.map(({ name, defaultValue: _defaultValue, ...input }) => ({
          ...input,
          label:
            name === "image"
              ? `Image ${slot}`
              : `Image ${slot}: ${input.label}`,
          name:
            name === "image"
              ? `image${slot}`
              : `image${slot}${name[0].toUpperCase()}${name.slice(1)}`,
          condition: (data: ImageWithTextProps) =>
            slot === 1 || data.layout !== "split",
        })),
      ),
    },
    {
      group: "Background",
      inputs: sectionBackgroundInputs(DEFAULT_BACKGROUND_COLOR),
    },
  ],
  childTypes: ["image-with-text--content", "image-with-text--images"],
  presets: {
    layout: "overlay",
    width: "full",
    verticalPadding: "none",
    mediaPosition: "right",
    mobileMediaPosition: "top",
    mobileImageRadius: 0,
    showVerticalSpacing: true,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    backgroundFor: "section",
    image1: IMAGES_PLACEHOLDERS.image,
    image2: IMAGES_PLACEHOLDERS.image,
    image1BorderRadius: 0,
    image2BorderRadius: 0,
    image1ObjectFit: "cover",
    image2ObjectFit: "cover",
    children: [
      { type: "image-with-text--content" },
      {
        type: "image-with-text--images",
        imageAspectRatio: "1/1",
      },
    ],
  },
});
