import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { createContext, forwardRef, useContext, useMemo } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

// Accordion Context
interface AccordionContextValue {
  layout: "column" | "row";
}

const AccordionContext = createContext<AccordionContextValue | undefined>(
  undefined,
);

const AccordionProvider = AccordionContext.Provider;

export function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    return { layout: "column" as const };
  }
  return context;
}

// Accordion Section Props
interface AccordionSectionProps extends SectionProps {
  accordionLayout: "column" | "row";
}

const AccordionSection = forwardRef<HTMLElement, AccordionSectionProps>(
  (props, ref) => {
    let { accordionLayout, children, ...rest } = props;

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
      () => ({ layout: accordionLayout }),
      [accordionLayout],
    );

    return (
      <Section ref={ref} {...rest}>
        <AccordionProvider value={contextValue}>
          <div
            className={clsx(
              "grid h-full w-full items-center gap-8 md:gap-12 lg:gap-16",
              accordionLayout === "row"
                ? "grid-cols-1 justify-start"
                : "grid-cols-1 md:grid-cols-2",
            )}
          >
            {children}
          </div>
        </AccordionProvider>
      </Section>
    );
  },
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
