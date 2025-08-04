import { type ComponentLoaderArgs, createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import type { FeaturedProductsQuery } from "storefront-api.generated";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";

const FeaturedProducts = forwardRef<
  HTMLElement,
  SectionProps<FeaturedProductsLoaderData>
>((props, ref) => {
  const { loaderData, children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
});

export default FeaturedProducts;

const FEATURED_PRODUCTS_QUERY = `#graphql
  query featuredProducts($country: CountryCode, $language: LanguageCode, $handle: String!)
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: 16) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export type FeaturedProductsLoaderData = Awaited<ReturnType<typeof loader>>;

export const loader = async ({ weaverse, data }: ComponentLoaderArgs) => {
  const { language, country } = weaverse.storefront.i18n;
  const { collectionHandle = 'frontpage' } = data;
  
  return await weaverse.storefront.query<FeaturedProductsQuery>(
    FEATURED_PRODUCTS_QUERY,
    {
      variables: {
        country,
        language,
        handle: collectionHandle,
      },
    },
  );
};

export const schema = createSchema({
  type: "featured-products",
  title: "Featured products",
  childTypes: ["featured-products-items", "featured-content-products"],
  settings: [
    {
      group: "Collection",
      inputs: [
        {
          type: "text",
          name: "collectionHandle",
          label: "Collection handle",
          defaultValue: "frontpage",
          placeholder: "Enter collection handle (e.g., frontpage, featured)",
        },
      ],
    },
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
  ],
  presets: {
    gap: 32,
    collectionHandle: "frontpage",
    children: [
      { type: "featured-content-products" },
      { type: "featured-products-items" },
    ],
  },
});
