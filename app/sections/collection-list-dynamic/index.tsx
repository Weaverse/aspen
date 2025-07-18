import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface CollectionListDynamicProps
  extends SectionProps,
    VariantProps<typeof variants> {}

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      left: "justify-center items-start [&_.paragraph]:[text-align:left]",
      center: "justify-center items-center [&_.paragraph]:[text-align:center]",
      right: "justify-center items-end [&_.paragraph]:[text-align:right]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
  },
});

let CollectionListDynamic = forwardRef<HTMLElement, CollectionListDynamicProps>(
  (props, ref) => {
    let { children, contentPosition, ...rest } = props;

    return (
      <Section
        ref={ref}
        {...rest}
        containerClassName={variants({
          contentPosition,
        })}
      >
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
  childTypes: [
    "collection-list-dynamic-items",
    "heading",
    "subheading",
    "paragraph",
    "button",
  ],
  inspector: [
    {
      group: "Collection List",
      inputs: [
        // Remove collections and layout from here
        {
          type: "toggle-group",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "left" },
              { value: "center", label: "center" },
              { value: "right", label: "right" },
            ],
          },
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
  ],
  presets: {
    gap: 32,
    children: [
      { type: "heading", content: "Collections" },
      {
        type: "collection-list-dynamic-items",
      },
    ],
  },
};
