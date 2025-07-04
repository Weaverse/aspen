import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
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
  }
);

export default PromotionGrid;

export const schema = createSchema({
  type: "promotion-grid",
  title: "Promotion grid",
  settings: [
    { group: "Layout", inputs: layoutInputs },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["grid-items", "heading", "paragraph"],
  presets: {
    children: [
      { type: "heading", content: "EXPLORE MORE" },
      {
        type: "paragraph",
        content:
          "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
      },
      {
        type: "grid-items",
      },
    ],
  },
});
