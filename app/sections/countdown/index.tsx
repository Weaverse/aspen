import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

const variants = cva("flex flex-col", {
  variants: {
    height: {
      small: "min-h-[40vh] lg:min-h-[50vh]",
      medium: "min-h-[50vh] lg:min-h-[60vh]",
      large: "min-h-[70vh] lg:min-h-[80vh]",
      full: "",
    },
    contentPosition: {
      "top left": "items-start justify-start",
      "top center": "items-center justify-start",
      "top right": "items-end justify-start",
      "center left": "items-start justify-center",
      "center center": "items-center justify-center",
      "center right": "items-end justify-center",
      "bottom left": "items-start justify-end",
      "bottom center": "items-center justify-end",
      "bottom right": "items-end justify-end",
    },
  },
  defaultVariants: {
    height: "small",
    contentPosition: "center center",
  },
});

interface CountdownProps extends VariantProps<typeof variants>, SectionProps {
  scenario?: "scenario1" | "scenario2";
}

const Countdown = forwardRef<HTMLElement, CountdownProps>((props, ref) => {
  const {
    children,
    height,
    contentPosition,
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
          isScenario2
            ? "flex items-end justify-center"
            : variants({ height, contentPosition }),
        )}
        style={
          isScenario2 && typeof verticalPadding === "number"
            ? { paddingTop: verticalPadding, paddingBottom: verticalPadding }
            : undefined
        }
      >
        <div
          className={cn(
            "grid w-full grid-cols-1 gap-x-12 gap-y-3 md:gap-y-6",
            isScenario2
              ? "md:grid-cols-3 md:grid-rows-2 md:gap-x-4"
              : "countdown-wrapper lg:grid-cols-2",
            isScenario2
              ? "[&_.button-countdown]:order-4 [&_.button-countdown]:h-fit md:[&_.button-countdown]:col-start-3 md:[&_.button-countdown]:row-span-2 md:[&_.button-countdown]:row-start-1 md:[&_.button-countdown]:self-center [&_.countdown--timer]:order-3 md:[&_.countdown--timer]:col-start-2 md:[&_.countdown--timer]:row-span-2 md:[&_.countdown--timer]:row-start-1 md:[&_.countdown--timer]:self-center [&_.paragraph]:order-2 md:[&_.paragraph]:col-start-1 md:[&_.paragraph]:row-start-2 [&_.subheading]:order-1 md:[&_.subheading]:col-start-1 md:[&_.subheading]:row-start-1 [&_.subheading]:font-sans"
              : "[&_.subheading]:order-1 [&_.countdown--timer]:order-2 lg:[&_.countdown--timer]:order-3 [&_.paragraph]:order-3 lg:[&_.paragraph]:order-2 [&_.button-countdown]:order-4 [&_.button-countdown]:h-fit [&_.subheading]:font-sans",
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
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
          condition: "scenario.eq.scenario1",
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
    {
      group: "Background",
      inputs: backgroundInputs.filter((inp) => inp.name !== "backgroundPosition"),
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: [
    "subheading--countdown",
    "paragraph",
    "countdown--timer",
    "button--countdown",
  ],
  presets: {
    backgroundImage: IMAGES_PLACEHOLDERS.banner_2,
    width: "fixed",
    contentPosition: "center center",
    enableOverlay: true,
    overlayOpacity: 40,
    verticalPadding: "large",
    children: [
      {
        type: "subheading--countdown",
        content: "Sale ends in",
        color: "white",
      },
      {
        type: "paragraph",
        content: "Use this timer to create urgency and boost sales.",
        width: "full",
        color: "white",
      },
      {
        type: "countdown--timer",
        textColor: "white",
      },
      {
        type: "button--countdown",
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
