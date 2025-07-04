import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

const variants = cva("flex justify-center items-end", {
  variants: {
    height: {
      small: "h-[40vh] lg:h-[50vh]",
      medium: "h-[50vh] lg:h-[60vh]",
      large: "h-[70vh] lg:h-[80vh]",
      full: "",
    },
    defaultVariants: {
      height: "small",
    },
  },
});

interface CountdownProps extends VariantProps<typeof variants>, SectionProps {
  scenario?: "scenario1" | "scenario2";
}

const Countdown = forwardRef<HTMLElement, CountdownProps>((props, ref) => {
  const { children, height, gap = 24, scenario = "scenario1", ...rest } = props;
  const isScenario2 = scenario === "scenario2";

  return (
    <Section ref={ref} {...rest}>
      <div
        className={cn(
          isScenario2 ? "flex justify-center items-end" : variants({ height })
        )}
        style={{ gap }}
      >
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-y-4 justify-items-center [&_.paragraph]:text-center",
            isScenario2
              ? "[&_.heading]:order-1 md:[&_.subheading]:order-3 md:[&_.countdown--timer]:order-2 [&_.button]:order-4 [&_.subheading]:order-2 [&_.countdown--timer]:order-3"
              : "[&_.heading]:order-1 md:[&_.subheading]:order-2 md:[&_.countdown--timer]:order-3 [&_.button]:order-4 [&_.countdown--timer]:order-2 [&_.subheading]:order-3"
          )}
        >
          {children}
        </div>
      </div>
    </Section>
  );
});

export default Countdown;

export const schema = createSchema({
  type: "countdown",
  title: "Countdown",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "scenario",
          label: "Content scenario",
          defaultValue: "scenario1",
          configs: {
            options: [
              { value: "scenario1", label: "Scenario 1" },
              { value: "scenario2", label: "Scenario 2" },
            ],
          },
        },
        {
          type: "select",
          name: "width",
          label: "Content width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "stretch", label: "Stretch" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "fixed",
        },
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
            ],
          },
          defaultValue: "large",
          condition: "scenario.eq.scenario1",
        },
        {
          type: "range",
          name: "gap",
          label: "Content spacing",
          configs: {
            min: 16,
            max: 64,
            step: 8,
            unit: "px",
          },
          defaultValue: 24,
        },
        {
          type: "select",
          name: "verticalPadding",
          label: "Vertical padding",
          configs: {
            options: [
              { value: "none", label: "None" },
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "medium",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
      ],
    },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["heading", "subheading", "countdown--timer", "button"],
  presets: {
    backgroundImage: IMAGES_PLACEHOLDERS.banner_2,
    width: "stretch",
    enableOverlay: true,
    overlayOpacity: 40,
    verticalPadding: "large",
    children: [
      {
        type: "heading",
        content: "Sale ends in",
        color: "white",
      },
      {
        type: "subheading",
        content: "Use this timer to create urgency and boost sales.",
        width: "full",
        color: "white",
      },
      {
        type: "countdown--timer",
        textColor: "white",
      },
      {
        type: "button",
        text: "Shop now",
        variant: "custom",
        backgroundColor: "#00000000",
        textColor: "#fff",
        borderColor: "#fff",
        backgroundColorHover: "#fff",
        textColorHover: "#000",
        borderColorHover: "#fff",
      },
    ],
  },
});
