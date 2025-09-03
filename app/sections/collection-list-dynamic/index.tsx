import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface CollectionListDynamicProps extends SectionProps {}

let CollectionListDynamic = forwardRef<HTMLElement, CollectionListDynamicProps>(
  (props, ref) => {
    let { children, ...rest } = props;

    return (
      <Section ref={ref} {...rest} containerClassName={"flex flex-col"}>
        {children}
      </Section>
    );
  },
);

export default CollectionListDynamic;

// Remove the COLLECTIONS_QUERY and loader since they'll be moved to collection-items

export let schema: HydrogenComponentSchema = {
  type: "collection-list-dynamic",
  title: "Collection List Dynamic",
  childTypes: ["collection-content-dynamic", "collection-list-dynamic-items"],
  inspector: [
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
    gap: 32,
    children: [
      { type: "collection-content-dynamic" },
      {
        type: "collection-list-dynamic-items",
      },
    ],
  },
};
