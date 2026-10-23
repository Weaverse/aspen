import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { sectionBackgroundInputs } from "~/components/background-image";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

type InstagramProps = HydrogenComponentProps & SectionProps;

const DEFAULT_BACKGROUND_COLOR = "#EDEDED";

const instagramSectionSettings = sectionSettings.map((group) =>
  group.group === "Layout"
    ? {
        ...group,
        inputs: group.inputs.filter(
          (input) => input.name !== "width" && input.name !== "gap",
        ),
      }
    : group.group === "Background"
      ? {
          ...group,
          inputs: sectionBackgroundInputs(DEFAULT_BACKGROUND_COLOR),
        }
      : group,
);

const Instagram = forwardRef<HTMLElement, InstagramProps>((props, ref) => {
  const { children, backgroundColor, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      backgroundFor="section"
      backgroundColor={backgroundColor || DEFAULT_BACKGROUND_COLOR}
      width="full"
      className="instagram-section"
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
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    backgroundFor: "section",
    children: [
      {
        type: "instagram--content",
        headingContent: "INSTAGRAM",
        headingTagName: "h2",
        subheadingContent: "@yourbrand",
        paragraphContent: "Share images from your social feed here.",
        buttonContent: "EXPLORE NOW",
        to: "https://www.instagram.com/",
        alignment: "left",
        paragraphAlignment: "left",
      },
      { type: "instagram--slider" },
    ],
  },
};
