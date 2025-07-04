import type {
  ComponentLoaderArgs,
  HydrogenComponentSchema,
  WeaverseCollection,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import React, { forwardRef } from "react";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import type { SectionProps } from "~/components/section";
import { Section, layoutInputs } from "~/components/section";

interface CollectionListDynamicData {
  collections: WeaverseCollection[];
  layout: "grid" | "slider" | "showcase";
}

interface CollectionListDynamicProps
  extends SectionProps<CollectionListDynamicLoaderData>,
    VariantProps<typeof variants>,
    CollectionListDynamicData {}

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      "left":
        "justify-center items-start [&_.paragraph]:[text-align:left]",
      "center":
        "justify-center items-center [&_.paragraph]:[text-align:center]",
      "right":
        "justify-center items-end [&_.paragraph]:[text-align:right]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
  },
});

let CollectionListDynamic = forwardRef<HTMLElement, CollectionListDynamicProps>(
  (props, ref) => {
    let { loaderData, children, contentPosition, ...rest } = props;

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
  }
);

export default CollectionListDynamic;

let COLLECTIONS_QUERY = `#graphql
  query collectionByIds($country: CountryCode, $language: LanguageCode, $ids: [ID!]!)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Collection {
        id
        title
        handle
        onlineStoreUrl
        description
        image {
          id
          altText
          width
          height
          url
        }
        products(first: 3) {
          nodes {
            title
            handle
            featuredImage {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
` as const;

export type CollectionListDynamicLoaderData = Awaited<
  ReturnType<typeof loader>
>;

export let loader = async ({
  data,
  weaverse,
}: ComponentLoaderArgs<CollectionListDynamicData>) => {
  let { language, country } = weaverse.storefront.i18n;
  let ids = data.collections?.map(
    (collection) => `gid://shopify/Collection/${collection.id}`
  );
  if (ids?.length) {
    let { nodes } = await weaverse.storefront.query<CollectionsByIdsQuery>(
      COLLECTIONS_QUERY,
      {
        variables: {
          country,
          language,
          ids,
        },
      }
    );
    return nodes.filter(Boolean);
  }
  return [];
};

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
        {
          type: "collection-list",
          name: "collections",
          label: "Collections",
        },
        {
          type: "select",
          name: "layout",
          label: "Layout",
          configs: {
            options: [
              { value: "grid", label: "Grid" },
              { value: "slider", label: "Slider" },
              { value: "showcase", label: "Showcase" },
            ],
          },
          defaultValue: "grid",
        },
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
