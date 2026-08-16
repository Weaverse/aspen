import { ArrowRightIcon } from "@phosphor-icons/react";
import { createSchema, type WeaverseImage } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import { Link, useRouteLoaderData } from "react-router";
import { Image } from "~/components/image";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import ReviewIndex from "~/sections/judgeme-reviews/review-index";
import { cn } from "~/utils/cn";

export type FeaturedProductsLayout = "carousel" | "grid";

interface FeaturedProductsProps extends SectionProps {
  layout?: FeaturedProductsLayout;
  showProductPromo?: boolean;
  productPromoImage?: WeaverseImage | string;
  productPromoHeading?: string;
  productPromoLinkText?: string;
  productPromoLink?: string;
}

interface FeaturedProductsLayoutContextValue {
  layout: FeaturedProductsLayout;
  isLegacyLayout: boolean;
  isProductPage: boolean;
}

const FeaturedProductsLayoutContext =
  createContext<FeaturedProductsLayoutContextValue>({
    layout: "grid",
    isLegacyLayout: false,
    isProductPage: false,
  });

export const useFeaturedProductsLayout = () =>
  useContext(FeaturedProductsLayoutContext);

const FeaturedProducts = forwardRef<HTMLElement, FeaturedProductsProps>(
  (props, ref) => {
    const {
      children,
      className,
      layout,
      showProductPromo = true,
      productPromoImage,
      productPromoHeading = "DECORATE FOR HOLIDAYS AND BEYOND",
      productPromoLinkText = "EXPLORE NOW",
      productPromoLink = "/collections",
      ...rest
    } = props;
    const productRouteData = useRouteLoaderData<typeof productRouteLoader>(
      "routes/($locale).products.$productHandle",
    );
    const isProductPage = Boolean(productRouteData?.product);
    const fallbackPromoImage = productRouteData?.product?.media?.nodes?.find(
      (media) => media.previewImage?.url,
    )?.previewImage;
    const promoImage =
      typeof productPromoImage === "string"
        ? { url: productPromoImage, altText: productPromoHeading }
        : productPromoImage || fallbackPromoImage;
    const resolvedLayout = isProductPage ? "carousel" : (layout ?? "grid");
    const isLegacyLayout = isProductPage ? false : layout === undefined;
    const isGrid = resolvedLayout === "grid";

    return (
      <FeaturedProductsLayoutContext.Provider
        value={{ layout: resolvedLayout, isLegacyLayout, isProductPage }}
      >
        <Section
          ref={ref}
          {...rest}
          className={cn(
            "overflow-x-clip",
            isGrid && !isProductPage ? "bg-[#F4F4F5]" : "bg-white",
            className,
          )}
          containerClassName={cn(
            "flex flex-col md:px-(--page-padding)",
            isGrid ? "space-y-16 py-20" : "space-y-12 py-20 md:py-16",
          )}
          gap={0}
          overflow="unset"
          verticalPadding="none"
          width="fixed"
        >
          {children}
          {isProductPage && showProductPromo && promoImage?.url && (
            <article className="hidden overflow-hidden rounded-xl border border-line-subtle md:block">
              <div className="relative aspect-[1.55/1] overflow-hidden">
                <Image
                  data={promoImage}
                  width={1600}
                  sizes="(min-width: 1280px) 1200px, 92vw"
                  className="h-full w-full object-cover"
                />
                <h2 className="absolute top-16 left-16 max-w-[12ch] font-heading text-[clamp(2.75rem,6vw,4.5rem)] uppercase leading-[1.05] tracking-[-0.035em]">
                  {productPromoHeading}
                </h2>
              </div>
              <Link
                to={productPromoLink}
                className="flex min-h-16 items-center gap-4 px-5 font-semibold text-sm uppercase"
              >
                {productPromoLinkText}
                <ArrowRightIcon aria-hidden="true" className="size-5" />
              </Link>
            </article>
          )}
          {isProductPage && (
            <div className="pt-8 md:hidden">
              <ReviewIndex />
            </div>
          )}
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
    {
      group: "Product page promo",
      inputs: [
        {
          type: "switch",
          name: "showProductPromo",
          label: "Show desktop product promo",
          defaultValue: true,
        },
        {
          type: "image",
          name: "productPromoImage",
          label: "Promo image",
          helpText: "Falls back to product media when no image is selected.",
          condition: (data: FeaturedProductsProps) =>
            data.showProductPromo === true,
        },
        {
          type: "textarea",
          name: "productPromoHeading",
          label: "Promo heading",
          defaultValue: "DECORATE FOR HOLIDAYS AND BEYOND",
          condition: (data: FeaturedProductsProps) =>
            data.showProductPromo === true,
        },
        {
          type: "text",
          name: "productPromoLinkText",
          label: "Promo link text",
          defaultValue: "EXPLORE NOW",
          condition: (data: FeaturedProductsProps) =>
            data.showProductPromo === true,
        },
        {
          type: "url",
          name: "productPromoLink",
          label: "Promo link",
          defaultValue: "/collections",
          condition: (data: FeaturedProductsProps) =>
            data.showProductPromo === true,
        },
      ],
    },
  ],
  presets: {
    layout: "grid",
    gap: 0,
    width: "fixed",
    verticalPadding: "medium",
    showProductPromo: true,
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
