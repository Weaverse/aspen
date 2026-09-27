import { Pagination } from "@shopify/hydrogen";
import { createSchema, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef } from "react";
import { useLoaderData } from "react-router";
import type { AllProductsQuery } from "storefront-api.generated";
import { BreadCrumb } from "~/components/breadcrumb";
import { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { SaleFilterStatus } from "~/components/sale-filter-status";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";

interface AllProductsProps extends SectionProps {
  heading: string;
  prevPageText: string;
  nextPageText: string;
}

const AllProducts = forwardRef<HTMLElement, AllProductsProps>((props, ref) => {
  const translateText = useTranslatedText();

  const { t } = useTranslation();
  const {
    heading: rawI18nHeading,
    prevPageText: rawI18nPrevPageText,
    nextPageText: rawI18nNextPageText,
    ...rest
  } = props;
  const nextPageText = translateText(
    rawI18nNextPageText,
    "themeContent.sectionsAllProducts.nextPageText",
  );
  const prevPageText = translateText(
    rawI18nPrevPageText,
    "themeContent.sectionsAllProducts.prevPageText",
  );
  const heading = translateText(
    rawI18nHeading,
    "themeContent.sectionsAllProducts.heading",
  );
  const { products } = useLoaderData<AllProductsQuery>();

  return (
    <Section ref={ref} {...rest} overflow="unset">
      <BreadCrumb page={heading} className="mb-4 justify-center" />
      <h4 className="mb-8 text-center font-medium lg:mb-20">{heading}</h4>
      <SaleFilterStatus />
      {products.nodes.length === 0 && (
        <p className="py-8 text-center">{t("product.noProducts")}</p>
      )}
      <Pagination connection={products}>
        {({
          nodes,
          isLoading,
          NextLink,
          PreviousLink,
          hasNextPage,
          hasPreviousPage,
        }) => {
          return (
            <div className="flex w-full flex-col items-center gap-8">
              {hasPreviousPage && (
                <PreviousLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? t("system.loading") : prevPageText}
                </PreviousLink>
              )}
              <div
                className={clsx([
                  "w-full gap-x-5 gap-y-8",
                  "grid grid-cols-1 lg:grid-cols-2",
                ])}
              >
                {nodes.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasNextPage && (
                <NextLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? t("system.loading") : nextPageText}
                </NextLink>
              )}
            </div>
          );
        }}
      </Pagination>
    </Section>
  );
});

export default AllProducts;

export const schema = createSchema({
  type: "all-products",
  title: "All products",
  limit: 1,
  enabledOn: {
    pages: ["ALL_PRODUCTS"],
  },
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter(
          (inp) =>
            inp.name !== "divider" &&
            inp.name !== "borderRadius" &&
            inp.name !== "gap",
        ),
      ],
    },
    {
      group: "All products",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "All Products",
          placeholder: "All Products",
        },
        {
          type: "text",
          name: "prevPageText",
          label: "Previous page text",
          defaultValue: "↑ Load previous",
          placeholder: "↑ Load previous",
        },
        {
          type: "text",
          name: "nextPageText",
          label: "Next page text",
          defaultValue: "Load more ↓",
          placeholder: "Load more ↓",
        },
      ],
    },
  ],
});
