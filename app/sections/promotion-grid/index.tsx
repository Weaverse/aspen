import { createSchema } from "@weaverse/hydrogen";
import {
  type CSSProperties,
  createContext,
  forwardRef,
  useContext,
} from "react";
import { sectionBackgroundInputs } from "~/components/background-image";
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
    const { children, layout, style, ...rest } = props;
    const hasCustomBackground = Boolean(
      rest.backgroundColor || rest.backgroundImage,
    );
    return (
      <PromotionGridLayoutContext.Provider value={layout}>
        <Section
          ref={ref}
          {...rest}
          backgroundFor="section"
          style={
            {
              ...style,
              // Let the section image/color show through the Style 1 shell.
              "--promotion-slider-background": hasCustomBackground
                ? "transparent"
                : undefined,
            } as CSSProperties
          }
        >
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
    { group: "Background", inputs: sectionBackgroundInputs() },
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
