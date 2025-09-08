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
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
});

export let schema: HydrogenComponent["schema"] = {
  title: "Videos",
  type: "videos",
  inspector: sectionSettings,
  childTypes: ["heading", "video--items"],
  presets: {
    children: [
      {
        type: "heading",
        content: "VIDEOS",
      },
      {
        type: "video--items",
      },
    ],
  },
};

Videos.displayName = "Videos";
export default Videos;
