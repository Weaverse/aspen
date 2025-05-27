import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section, sectionInspector } from "~/components/section";

// Accordion Section Props
export type AccordionSectionProps = SectionProps;

const AccordionSection = forwardRef<HTMLElement, AccordionSectionProps>(
  (props, ref) => {
    let { children, ...rest } = props;

    return (
      <Section ref={ref} {...rest}>
        <div className="w-full h-full grid md:grid-cols-2 grid-cols-1 justify-center items-center lg:gap-16 md:gap-12 gap-8">{children}</div>
      </Section>
    );
  }
);

export default AccordionSection;

export const schema: HydrogenComponentSchema = {
  type: "accordion",
  title: "Accordion",
  inspector: [
    {
      group: "Accordion settings",
      inputs:[
        ...layoutInputs.filter((input) => input.name !== "gap"),
        ...backgroundInputs,
        ...overlayInputs,
      ] 
    },
  ],
  childTypes: ["content-information", "accordion-group"],
  presets: {
    children: [
      {
        type: "content-information",
      },
      {
        type: "accordion-group",
      },
    ],
  },
};
