import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { cn } from "~/utils/cn";

export type CollectionListLayout = "grid" | "slider" | "showcase";

interface CollectionListDynamicProps extends SectionProps {
  layout?: CollectionListLayout;
}

interface CollectionListLayoutContextValue {
  layout: CollectionListLayout;
  isLegacyLayout: boolean;
}

const CollectionListLayoutContext =
  createContext<CollectionListLayoutContextValue>({
    layout: "grid",
    isLegacyLayout: true,
  });

export const useCollectionListLayout = () =>
  useContext(CollectionListLayoutContext);

export function resolveCollectionListLayout(
  layout?: CollectionListLayout,
  legacyLayout?: CollectionListLayout,
) {
  return layout ?? legacyLayout ?? "grid";
}

let CollectionListDynamic = forwardRef<HTMLElement, CollectionListDynamicProps>(
  (props, ref) => {
    let {
      children,
      className,
      layout,
      verticalPadding = "medium",
      ...rest
    } = props;
    const usesDesignPadding = verticalPadding === "medium";
    const resolvedLayout = resolveCollectionListLayout(layout);

    return (
      <CollectionListLayoutContext.Provider
        value={{ layout: resolvedLayout, isLegacyLayout: layout === undefined }}
      >
        <Section
          ref={ref}
          {...rest}
          className={cn("overflow-x-clip", className)}
          containerClassName={cn("flex flex-col", usesDesignPadding && "py-20")}
          overflow="unset"
          verticalPadding={usesDesignPadding ? "none" : verticalPadding}
        >
          {children}
        </Section>
      </CollectionListLayoutContext.Provider>
    );
  },
);

export default CollectionListDynamic;

export let schema: HydrogenComponentSchema = {
  type: "feature-collection",
  title: "Featured collections",
  childTypes: ["collection-content-dynamic", "collection-list-dynamic-items"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout",
          shouldRevalidate: true,
          helpText:
            "Style 1 always shows 6 cards. Style 3 always shows 3 cards.",
          configs: {
            options: [
              { value: "grid", label: "Style 1" },
              { value: "slider", label: "Style 2" },
              { value: "showcase", label: "Style 3" },
            ],
          },
        },
      ],
    },
    {
      group: "Collection List",
      inputs: [
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
  ],
  presets: {
    layout: "grid",
    gap: 64,
    width: "fixed",
    verticalPadding: "medium",
    children: [
      {
        type: "collection-content-dynamic",
        displayMode: "vertical",
        contentPosition: "center",
        gap: 28,
        headingContent: "EXPLORE COLLECTIONS",
        headingTagName: "h2",
        weight: "400",
        letterSpacing: "tight",
        alignment: "center",
        paragraphContent:
          "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
        paragraphAlignment: "center",
        paragraphWidth: "narrow",
        buttonContent: "EXPLORE NOW",
        to: "/collections",
        variant: "decor",
        sliderHeadingContent: "COLLECTIONS",
        sliderButtonContent: "VIEW ALL",
        sliderTo: "/collections",
      },
      {
        type: "collection-list-dynamic-items",
        gap: 16,
        desktopGap: 20,
        collectionNameColor: "#FEF4EB",
        collectionBackgroundColor: "#7F7866",
      },
    ],
  },
};
