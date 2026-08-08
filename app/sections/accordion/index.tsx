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
    let {
      accordionLayout,
      children,
      backgroundColor = "#F7F7F7",
      backgroundFor = "section",
      ...rest
    } = props;

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
      () => ({ layout: accordionLayout }),
      [accordionLayout],
    );

    return (
      <Section
        ref={ref}
        {...rest}
        width="full"
        backgroundColor={backgroundColor}
        backgroundFor={backgroundFor}
      >
        <AccordionProvider value={contextValue}>
          <div
            className={clsx(
              "mx-auto grid h-full w-full max-w-[1360px] items-start gap-10 px-5 lg:gap-16 lg:px-0",
              accordionLayout === "row"
                ? "grid-cols-1 justify-start lg:gap-12"
                : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_648px]",
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
  settings: [
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
              { value: "column", label: "Contact + FAQ" },
              { value: "row", label: "Two-column FAQ" },
            ],
          },
        },
      ],
    },
  ],
  childTypes: ["content-information", "accordion-group"],
  presets: {
    width: "full",
    verticalPadding: "medium",
    backgroundColor: "#F7F7F7",
    backgroundFor: "section",
    accordionLayout: "column",
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
