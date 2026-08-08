import type { HydrogenComponent } from "@weaverse/hydrogen";
import type { ReactNode } from "react";
import { forwardRef } from "react";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface VideosProps extends SectionProps {
  children?: ReactNode;
}

let Videos = forwardRef<HTMLElement, VideosProps>((props, ref) => {
  let { children, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      className="bg-white lg:bg-[#F4F4F5]"
      containerClassName="!max-w-[1360px] !space-y-10 [&>.heading]:text-left lg:!space-y-16"
    >
      {children}
    </Section>
  );
});

export let schema: HydrogenComponent["schema"] = {
  title: "Videos",
  type: "videos",
  settings: sectionSettings,
  childTypes: ["heading", "video--items"],
  presets: {
    width: "fixed",
    verticalPadding: "medium",
    gap: 40,
    children: [
      {
        type: "heading",
        content: "VIDEOS",
        as: "h2",
        size: "scale",
        minSize: 36,
        maxSize: 44,
        alignment: "left",
        weight: "400",
        letterSpacing: "normal",
      },
      {
        type: "video--items",
      },
    ],
  },
};

Videos.displayName = "Videos";
export default Videos;
