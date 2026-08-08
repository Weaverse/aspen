import { createSchema } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

export type FeaturedProductsLayout = "carousel" | "grid";

interface FeaturedProductsProps extends SectionProps {
  layout?: FeaturedProductsLayout;
}

interface FeaturedProductsLayoutContextValue {
  layout: FeaturedProductsLayout;
  isLegacyLayout: boolean;
}

const FeaturedProductsLayoutContext =
  createContext<FeaturedProductsLayoutContextValue>({
    layout: "grid",
    isLegacyLayout: false,
  });

export const useFeaturedProductsLayout = () =>
  useContext(FeaturedProductsLayoutContext);

const FeaturedProducts = forwardRef<HTMLElement, FeaturedProductsProps>(
  (props, ref) => {
    const { children, className, layout, ...rest } = props;
    const resolvedLayout = layout ?? "grid";
    const isLegacyLayout = layout === undefined;
    const isGrid = resolvedLayout === "grid";

    return (
      <FeaturedProductsLayoutContext.Provider
        value={{ layout: resolvedLayout, isLegacyLayout }}
      >
        <Section
          ref={ref}
          {...rest}
          className={cn(
            "overflow-x-clip",
            isGrid ? "bg-[#F4F4F5]" : "bg-white",
            className,
          )}
          containerClassName={cn(
            "flex flex-col md:px-(--page-padding)",
            isGrid ? "space-y-16 py-20" : "space-y-12 py-20 md:py-10",
          )}
          gap={0}
          overflow="unset"
          verticalPadding="none"
          width="fixed"
        >
          {children}
        </Section>
      </FeaturedProductsLayoutContext.Provider>
    );
  },
);

export default FeaturedProducts;

export const schema = createSchema({
  type: "featured-products",
  title: "Featured products",
  childTypes: ["featured-products-items", "featured-content-products"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Product layout",
          configs: {
            options: [
              {
                value: "carousel",
                label: "Scenario 1 — Product carousel",
              },
              { value: "grid", label: "Scenario 2 — Product grid" },
            ],
          },
          defaultValue: "grid",
        },
      ],
    },
  ],
  presets: {
    layout: "grid",
    gap: 0,
    width: "fixed",
    verticalPadding: "medium",
    children: [
      {
        type: "featured-content-products",
        displayMode: "vertical",
        contentPosition: "center",
        gap: 16,
        headingContent: "EXPLORE QUALITY PRODUCTS",
        headingTagName: "h2",
        weight: "400",
        letterSpacing: "tight",
        alignment: "center",
        paragraphContent:
          "Considered materials, enduring construction, and comfort designed for everyday life.",
        paragraphAlignment: "center",
        paragraphWidth: "narrow",
        buttonContent: "EXPLORE NOW",
        to: "/products",
        variant: "decor",
        carouselHeadingContent: "FEATURED PRODUCTS",
        carouselButtonContent: "VIEW ALL",
        carouselTo: "/products",
      },
      {
        type: "featured-products-items",
        layout: "grid",
        slidesPerView: 3,
        itemsPerRow: "2",
        gap: 16,
        productsToShow: 4,
        arrowsColor: "secondary",
        arrowsShape: "rounded-sm",
        arrowsIcon: "arrow",
      },
    ],
  },
});
