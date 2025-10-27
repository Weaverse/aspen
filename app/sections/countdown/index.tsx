import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

const variants = cva("flex items-end justify-center", {
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

interface CountdownProps
  extends VariantProps<typeof variants>,
    SectionProps {
  scenario?: "scenario1" | "scenario2";
}

const Countdown = forwardRef<HTMLElement, CountdownProps>((props, ref) => {
  const {
    children,
    height,
    scenario = "scenario1",
    verticalPadding,
    ...rest
  } = props;
  const isScenario2 = scenario === "scenario2";

  return (
    <Section
      ref={ref}
      {...rest}
      verticalPadding={isScenario2 ? undefined : verticalPadding}
    >
      <div
        className={cn(
          isScenario2 ? "flex items-end justify-center" : variants({ height }),
        )}
        style={
          isScenario2 && typeof verticalPadding === "number"
            ? { paddingTop: verticalPadding, paddingBottom: verticalPadding }
            : undefined
        }
      >
        <div
          className={cn(
            "grid grid-cols-1 gap-x-6 gap-y-4",
            isScenario2
              ? "md:grid-cols-3 md:grid-rows-2 md:gap-x-4"
              : "md:grid-cols-2",
            isScenario2
              ? "[&_.button]:order-4 [&_.button]:justify-self-center md:[&_.button]:col-start-3 md:[&_.button]:row-span-2 md:[&_.button]:row-start-1 md:[&_.button]:self-center [&_.countdown--timer]:order-3 md:[&_.countdown--timer]:col-start-2 md:[&_.countdown--timer]:row-span-2 md:[&_.countdown--timer]:row-start-1 md:[&_.countdown--timer]:self-center [&_.heading]:order-1 md:[&_.heading]:col-start-1 md:[&_.heading]:row-start-1 [&_.subheading]:order-2 md:[&_.subheading]:col-start-1 md:[&_.subheading]:row-start-2"
              : "[&_.button]:order-4 [&_.button]:justify-self-center [&_.countdown--timer]:order-2 md:[&_.countdown--timer]:order-3 [&_.heading]:order-1 [&_.subheading]:order-3 md:[&_.subheading]:order-2",
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
          label: "Layout",
          defaultValue: "scenario1",
          configs: {
            options: [
              { value: "scenario1", label: "Style 1" },
              { value: "scenario2", label: "Style 2" },
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
          condition: "scenario.eq.scenario1",
        },
        {
          type: "range",
          name: "verticalPadding",
          label: "Vertical padding",
          configs: {
            min: 0,
            max: 200,
            step: 8,
            unit: "px",
          },
          defaultValue: 80,
          condition: "scenario.eq.scenario2",
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
  childTypes: [
    "countdown--heading",
    "subheading",
    "countdown--timer",
    "button",
  ],
  presets: {
    backgroundImage: IMAGES_PLACEHOLDERS.banner_2,
    width: "stretch",
    enableOverlay: true,
    overlayOpacity: 40,
    verticalPadding: "large",
    children: [
      {
        type: "countdown--heading",
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
