import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";
import {
  type ImageAspectRatioType,
  ImageWithTextContext,
  type ImageWithTextLayout,
} from "./context";

interface ImageWithTextProps extends SectionProps {
  layout?: ImageWithTextLayout;
  mediaPosition?: "left" | "right";
}

const ImageWithText = forwardRef<HTMLElement, ImageWithTextProps>(
  (props, ref) => {
    const {
      children,
      className,
      layout,
      mediaPosition = "right",
      backgroundColor = "#F0F0EF",
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
        }}
      >
        <Section
          ref={ref}
          {...rest}
          className={cn("overflow-x-clip bg-[#F0F0EF]", className)}
          containerClassName={cn(
            "px-0 sm:px-0",
            isOverlay
              ? "relative flex h-[417px] flex-row md:h-[960px]"
              : cn(
                  "flex h-[860px] flex-col-reverse md:h-[944px] md:flex-row",
                  mediaPosition === "left" && "md:flex-row-reverse",
                ),
          )}
          backgroundColor={backgroundColor || "#F0F0EF"}
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
                label: "Scenario 1 — Two-image overlay",
              },
              { value: "split", label: "Scenario 2 — Image and text" },
            ],
          },
          defaultValue: "overlay",
        },
        {
          type: "toggle-group",
          name: "mediaPosition",
          label: "Image position on desktop",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ],
          },
          defaultValue: "right",
          condition: (data: ImageWithTextProps) => data.layout === "split",
        },
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs.filter(
        (input) => input.name !== "backgroundFor",
      ),
    },
  ],
  childTypes: ["image-with-text--content", "image-with-text--images"],
  presets: {
    layout: "overlay",
    width: "full",
    verticalPadding: "none",
    mediaPosition: "right",
    backgroundColor: "#F0F0EF",
    backgroundFor: "section",
    children: [
      { type: "image-with-text--content" },
      {
        type: "image-with-text--images",
        imageAspectRatio: "1/1",
      },
    ],
  },
});
