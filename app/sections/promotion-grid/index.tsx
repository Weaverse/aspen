import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

type PromotionGridProps = SectionProps;

const PromotionGrid = forwardRef<HTMLElement, PromotionGridProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    return (
      <Section ref={ref} {...rest}>
        {children}
      </Section>
    );
  },
);

export default PromotionGrid;

export const schema = createSchema({
  type: "promotion-grid",
  title: "Promotion grid",
  settings: [{ group: "Layout", inputs: layoutInputs }],
  childTypes: ["grid-items", "promotion-grid-content"],
  presets: {
    children: [
      { type: "promotion-grid-content" },
      {
        type: "grid-items",
      },
    ],
  },
});
