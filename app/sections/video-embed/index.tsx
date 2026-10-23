import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { sectionBackgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

type VideoEmbedProps = SectionProps;

const VideoEmbed = forwardRef<HTMLElement, VideoEmbedProps>((props, ref) => {
  const { children, ...rest } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      backgroundFor="section"
      containerClassName="flex flex-col"
    >
      {children}
    </Section>
  );
});

export default VideoEmbed;

export const schema = createSchema({
  type: "video-embed",
  title: "Video embed",
  childTypes: ["video-embed-content", "video-embed--item"],
  settings: [
    {
      group: "Video Embed",
      inputs: layoutInputs,
    },
    { group: "Background", inputs: sectionBackgroundInputs() },
  ],
  presets: {
    gap: 32,
    children: [
      {
        type: "video-embed-content",
      },
      {
        type: "video-embed--item",
      },
    ],
  },
});
