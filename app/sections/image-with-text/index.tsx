import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { cn } from "~/utils/cn";
import { type ImageAspectRatioType, ImageWithTextContext } from "./context";

type ImageWithTextProps = SectionProps;

const ImageWithText = forwardRef<HTMLElement, ImageWithTextProps>(
  (props, ref) => {
    const { children, ...rest } = props;

    const [imageCount, setImageCount] = useState(0);
    const [imageAspectRatio, setImageAspectRatio] =
      useState<ImageAspectRatioType>("1/1");

    return (
      <ImageWithTextContext.Provider
        value={{
          imageCount,
          setImageCount,
          imageAspectRatio,
          setImageAspectRatio,
        }}
      >
        <Section
          ref={ref}
          {...rest}
          containerClassName={cn(
            "px-0 sm:px-0",
            imageCount <= 1
              ? "flex flex-col md:flex-row"
              : imageCount > 1 &&
                  "relative flex aspect-square flex-row md:aspect-[unset] lg:aspect-auto",
          )}
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
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
  ],
  childTypes: ["image-with-text--content", "image-with-text--images"],
  presets: {
    verticalPadding: "none",
    backgroundColor: "#F0F0EF",
    backgroundFor: "content",
    children: [
      { type: "image-with-text--images" },
      { type: "image-with-text--content" },
    ],
  },
});
