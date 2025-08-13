import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

export interface HighlightsProps extends VariantProps<typeof variants> {
  backgroundColor?: string;
}

let variants = cva("w-full", {
  variants: {
    alignment: {
      left: "text-left",
      center: "text-center", 
      right: "text-right",
    },
  },
  defaultVariants: {
    alignment: "center",
  },
});

let Highlights = forwardRef<HTMLElement, HighlightsProps & SectionProps>(
  (props, ref) => {
    let { 
      children,
      backgroundColor = "#FFFFFF",
      alignment,
      ...rest 
    } = props;

    return (
      <Section
        ref={ref}
        {...rest}
        className={variants({ alignment })}
        style={{ backgroundColor }}
      >
        <div 
          style={{ 
            backgroundColor,
            borderRadius: "0px 40px 40px 40px",
            paddingTop: "5rem",
            paddingBottom: "5rem"
          }}
        >
          <div className="grid items-center justify-center grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto border border-[#A79D95]">
            {children}
          </div>
        </div>
      </Section>
    );
  },
);

export default Highlights;

export let schema = createSchema({
  type: "highlights",
  title: "Highlights",
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
      ),
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background Color",
          defaultValue: "#FFFFFF",
        },
      ],
    },
  ],
  childTypes: ["highlights-badge", "subheading", "paragraph"],
  presets: {
    alignment: "center",
    backgroundColor: "#FFFFFF",
    children: [
      {
        type: "highlights-badge",
        iconType: "circle",
        badgeTextColor: "#29231E",
        showBorder: true,
        children: [
          {
            type: "paragraph",
            content: "The best of every modern style from minimalist to mid century.",
            color: "#29231E",
          },
        ],
      },
      {
        type: "highlights-badge", 
        iconType: "square",
        badgeTextColor: "#29231E",
        showBorder: true,
        children: [
          {
            type: "paragraph",
            content: "Quality furniture made to last through moves and milestones.",
            color: "#29231E",
          },
        ],
      },
      {
        type: "highlights-badge",
        iconType: "triangle", 
        badgeTextColor: "#29231E",
        showBorder: false,
        children: [
          {
            type: "paragraph",
            content: "Delivery for free in days - not weeks.",
            color: "#29231E",
          },
        ],
      },
    ],
  },
}); 