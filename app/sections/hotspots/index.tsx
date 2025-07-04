import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { Section } from "~/components/section";

interface HotspotsProps
  extends HydrogenComponentProps,
    VariantProps<typeof variants> {}

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      left: "justify-center items-start [&_.paragraph]:[text-align:left]",
      center: "justify-center items-center [&_.paragraph]:[text-align:center]",
      right: "justify-center items-end [&_.paragraph]:[text-align:right]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
  },
});

let Hotspots = forwardRef<HTMLElement, HotspotsProps>((props, ref) => {
  let { contentPosition, children, ...rest } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      overflow="unset"
      containerClassName={variants({
        contentPosition,
      })}
    >
      {children}
    </Section>
  );
});

export default Hotspots;

export const schema = createSchema({
  type: "hotspots",
  title: "Hotspots",
  childTypes: [
    "hotspots-container",
    "heading",
    "subheading",
    "paragraph",
    "button",
  ],
  settings: [
    {
      group: "Layout",
      inputs: [
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
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
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
          type: "toggle-group",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "left" },
              { value: "center", label: "center" },
              { value: "right", label: "right" },
            ],
          },
        },
      ],
    },
  ],
  presets: {
    gap: 40,
    children: [
      {
        type: "heading",
        content: "SHOP THE LOOK",
      },
      {
        type: "paragraph",
        content:
          "Discover nomad, our best-selling and most-awarded modular seating.",
      },
      {
        type: "button",
        text: "EXPLORE NOW",
        variant: "decor",
      },
      {
        type: "hotspots-container",
      },
    ],
  },
});
