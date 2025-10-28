import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

const FeaturedProducts = forwardRef<HTMLElement, SectionProps>((props, ref) => {
  const { children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
});

export default FeaturedProducts;

export const schema = createSchema({
  type: "featured-products",
  title: "Featured products",
  childTypes: ["featured-products-items", "featured-content-products"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
  ],
  presets: {
    gap: 32,
    children: [
      { type: "featured-content-products" },
      { type: "featured-products-items" },
    ],
  },
});
