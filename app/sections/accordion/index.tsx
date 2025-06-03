import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

// Accordion Section Props
interface AccordionSectionProps extends SectionProps {
  accordionLayout: "column" | "row";
}

const AccordionSection = forwardRef<HTMLElement, AccordionSectionProps>(
  (props, ref) => {
    let { accordionLayout, children, ...rest } = props;

    return (
      <Section ref={ref} {...rest}>
        <div
          className={clsx(
            "w-full h-full grid items-center lg:gap-16 md:gap-12 gap-8",
            accordionLayout === "row"
              ? "justify-start grid-cols-1 md:[&_.accordion--group]:grid-cols-2 [&_.accordion--group]:grid-cols-1"
              : "md:grid-cols-2 grid-cols-1"
          )}
        >
          {children}
        </div>
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
      inputs: [
        ...layoutInputs.filter((input) => input.name !== "gap"),
        ...backgroundInputs,
        ...overlayInputs,
      ],
    },
    {
      group: "Accordion layout",
      inputs: [
        {
          type: "toggle-group",
          name: "accordionLayout",
          label: "Accordion layout",
          defaultValue: "column",
          configs: {
            options: [
              { value: "column", label: "Column" },
              { value: "row", label: "Row" },
            ],
          },
        },
      ],
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
