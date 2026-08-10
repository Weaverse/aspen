import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

type BeforeAndAfterProps = SectionProps;

const BeforeAndAfter = forwardRef<HTMLElement, BeforeAndAfterProps>(
  (props, ref) => {
    const {
      children,
      width = "full",
      gap = 0,
      verticalPadding = "none",
      ...rest
    } = props;
    return (
      <Section
        ref={ref}
        width={width}
        gap={gap}
        verticalPadding={verticalPadding}
        {...rest}
      >
        {children}
      </Section>
    );
  },
);

export default BeforeAndAfter;

export let schema: HydrogenComponentSchema = {
  type: "before-and-after",
  title: "Before & after",
  // toolbar: ['general-settings', ['duplicate', 'delete']],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        ({ name }) => name !== "divider" && name !== "borderRadius",
      ),
    },
  ],
  childTypes: [
    "heading",
    "subheading",
    "paragraph",
    "button",
    "before-after-slider",
  ],
  presets: {
    width: "full",
    gap: 0,
    verticalPadding: "none",
    children: [
      {
        type: "before-after-slider",
        heightMode: "aspen",
        separatorColor: "#FFFFFF",
        separatorWidth: 8,
        showList: true,
        listColor: "#524B46",
        initialPositionDesktop: 51,
        initialPositionMobile: 44,
      },
    ],
  },
};
