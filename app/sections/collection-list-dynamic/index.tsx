import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { cn } from "~/utils/cn";

interface CollectionListDynamicProps extends SectionProps {}

let CollectionListDynamic = forwardRef<HTMLElement, CollectionListDynamicProps>(
  (props, ref) => {
    let { children, className, verticalPadding = "medium", ...rest } = props;
    const usesDesignPadding = verticalPadding === "medium";

    return (
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
    );
  },
);

export default CollectionListDynamic;

// Remove the COLLECTIONS_QUERY and loader since they'll be moved to collection-items

export let schema: HydrogenComponentSchema = {
  type: "feature-collection",
  title: "Featured collections",
  childTypes: ["collection-content-dynamic", "collection-list-dynamic-items"],
  settings: [
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
        layout: "grid",
        gap: 16,
        desktopGap: 20,
        collectionNameColor: "#FEF4EB",
        collectionBackgroundColor: "#7F7866",
      },
    ],
  },
};
