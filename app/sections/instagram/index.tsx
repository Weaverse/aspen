import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

type InstagramProps = HydrogenComponentProps & SectionProps;

const instagramSectionSettings = sectionSettings.map((group) =>
  group.group === "Layout"
    ? {
        ...group,
        inputs: group.inputs.filter(
          (input) => input.name !== "width" && input.name !== "gap",
        ),
      }
    : group,
);

const Instagram = forwardRef<HTMLElement, InstagramProps>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      width="full"
      className="instagram-section bg-[#EDEDED]"
    >
      <div className="instagram-row mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 min-[744px]:grid min-[744px]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] min-[744px]:items-stretch min-[744px]:gap-6 min-[744px]:px-8 min-[744px]:[&>*:only-child]:col-span-full lg:flex lg:flex-row lg:px-0">
        {children}
      </div>
    </Section>
  );
});

export default Instagram;

export const schema: HydrogenComponentSchema = {
  type: "instagram",
  title: "Instagram",
  settings: instagramSectionSettings,
  childTypes: ["instagram--content", "instagram--slider"],
  presets: {
    width: "full",
    verticalPadding: "medium",
    backgroundColor: "#EDEDED",
    backgroundFor: "section",
    children: [
      {
        type: "instagram--content",
        headingContent: "INSTAGRAM",
        headingTagName: "h2",
        subheadingContent: "@aspen_life",
        paragraphContent:
          "Meet the room edits: real life shots of our furniture in action.",
        buttonContent: "EXPLORE NOW",
        to: "https://www.instagram.com/",
        alignment: "left",
        paragraphAlignment: "left",
      },
      { type: "instagram--slider" },
    ],
  },
};
