import { createSchema } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

export type PromotionGridLayout = "slider" | "tabs";

type PromotionGridProps = SectionProps & {
  layout?: PromotionGridLayout;
};

const PromotionGridLayoutContext = createContext<
  PromotionGridLayout | undefined
>(undefined);

export const usePromotionGridLayout = () =>
  useContext(PromotionGridLayoutContext);

const PromotionGrid = forwardRef<HTMLElement, PromotionGridProps>(
  (props, ref) => {
    const { children, layout, ...rest } = props;
    return (
      <PromotionGridLayoutContext.Provider value={layout}>
        <Section ref={ref} {...rest}>
          {children}
        </Section>
      </PromotionGridLayoutContext.Provider>
    );
  },
);

export default PromotionGrid;

export const schema = createSchema({
  type: "promotion-grid",
  title: "Promotion grid",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout type",
          configs: {
            options: [
              { value: "slider", label: "Style 1" },
              { value: "tabs", label: "Style 2" },
            ],
          },
          // No schema default: existing sections retain their child's layout.
          helpText:
            "Applies to all promotion sliders in this section. Existing sections keep their saved style until you choose a layout here.",
        },
        ...layoutInputs,
      ],
    },
  ],
  childTypes: ["grid-items"],
  presets: {
    layout: "slider",
    width: "full",
    verticalPadding: "none",
    children: [
      {
        type: "grid-items",
      },
    ],
  },
});
