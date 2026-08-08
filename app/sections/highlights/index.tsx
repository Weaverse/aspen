import { createSchema } from "@weaverse/hydrogen";
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
    let { children, backgroundColor = "#FFFFFF", alignment, ...rest } = props;

    return (
      <Section
        ref={ref}
        {...rest}
        className={variants({ alignment })}
        style={{ backgroundColor }}
      >
        <div className="mx-5 grid grid-cols-1 overflow-hidden rounded-lg border border-[#9D9D9D] [&>*]:border-[#DEDEDE] [&>*]:border-b [&>*:last-child]:border-b-0 md:mx-0 md:grid-cols-3 md:[&>*]:border-b-0 md:[&>*+*]:border-l">
          {children}
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
    width: "fixed",
    gap: 0,
    verticalPadding: "medium",
    alignment: "center",
    backgroundColor: "#FFFFFF",
    children: [
      {
        type: "highlights-badge",
        iconType: "circle",
        showIcon: true,
        badgeTextColor: "#29231E",
        headingContent:
          "The best of every modern style from minimalist to mid century.",
        headingTagName: "h6",
        color: "#29231E",
        weight: "400",
        description: "Curated looks that feel timeless and effortless.",
        linkText: "Explore More",
        linkTo: "/collections/all",
      },
      {
        type: "highlights-badge",
        iconType: "square",
        showIcon: true,
        badgeTextColor: "#29231E",
        headingContent:
          "Quality furniture made to last through moves and milestones.",
        headingTagName: "h6",
        color: "#29231E",
        weight: "400",
        description: "Built with durable materials for years of daily use.",
        linkText: "Explore More",
        linkTo: "/collections/all",
      },
      {
        type: "highlights-badge",
        iconType: "triangle",
        showIcon: true,
        badgeTextColor: "#29231E",
        headingContent: "Delivery for free in days — not weeks.",
        headingTagName: "h6",
        color: "#29231E",
        weight: "400",
        description: "Fast, reliable shipping that fits your schedule.",
        linkText: "Explore More",
        linkTo: "/collections/all",
      },
    ],
  },
});
