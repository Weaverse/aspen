import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

type BeforeAndAfterProps = SectionProps;

const BeforeAndAfter = forwardRef<HTMLElement, BeforeAndAfterProps>(
  (props, ref) => {
    let { children, ...rest } = props;
    return (
      <Section ref={ref} {...rest}>
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
  inspector: [
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
    children: [
      {
        type: "heading",
        content: "Before & After",
      },
      {
        type: "before-after-slider",
      },
    ],
  },
};
