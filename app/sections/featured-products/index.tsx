import { ArrowRightIcon } from "@phosphor-icons/react";
import { createSchema, type WeaverseImage } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import { useRouteLoaderData } from "react-router";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { useTranslatedText } from "~/hooks/use-translated-text";
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
    const translateText = useTranslatedText();

    const {
      children,
      className,
      layout,
      showProductPromo = true,
      productPromoImage,
      productPromoHeading:
        rawI18nProductPromoHeading = "DECORATE FOR HOLIDAYS AND BEYOND",
      productPromoLinkText: rawI18nProductPromoLinkText = "EXPLORE NOW",
      productPromoLink = "/collections",
      ...rest
    } = props;
    const productPromoLinkText = translateText(
      rawI18nProductPromoLinkText,
      "themeContent.sectionsFeaturedProductsIndex.productPromoLinkText",
    );
    const productPromoHeading = translateText(
      rawI18nProductPromoHeading,
      "themeContent.sectionsFeaturedProductsIndex.productPromoHeading",
    );
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
            "flex flex-col",
            isGrid ? "space-y-16 py-20" : "space-y-16 py-20",
            isProductPage && "md:space-y-0",
          )}
          gap={0}
          overflow="unset"
          verticalPadding="none"
          width="fixed"
        >
          {children}
          {isProductPage && showProductPromo && promoImage?.url && (
            <article className="hidden overflow-hidden rounded-xl border border-line-subtle md:!mt-20 md:block">
              <div className="relative aspect-[1.45/1] overflow-hidden lg:aspect-[2.75/1]">
                <Image
                  data={promoImage}
                  width={1600}
                  sizes="(min-width: 1280px) 1200px, 92vw"
                  className="h-full w-full object-cover"
                />
                <h2 className="absolute top-8 left-6 max-w-[12ch] font-heading text-[clamp(1.75rem,4vw,3.5rem)] md:top-16 md:left-16 md:max-w-[440px] md:text-[53px] uppercase leading-[1.05] tracking-[-0.035em] lg:max-w-[440px] lg:text-[53px] lg:leading-[1.1] lg:tracking-[-1.59px]">
                  {productPromoHeading}
                </h2>
              </div>
              <Link
                to={productPromoLink}
                className="flex min-h-16 items-center gap-4 px-5 lg:justify-start font-semibold text-sm uppercase"
              >
                {productPromoLinkText}
                <ArrowRightIcon aria-hidden="true" className="size-5" />
              </Link>
            </article>
          )}
          {isProductPage && (
            <div className="pt-8 md:!mt-0 md:hidden">
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
                label: "Scenario 1",
              },
              { value: "grid", label: "Scenario 2" },
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
          label: "Show product promo",
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
      },
      {
        type: "featured-products-items",
        layout: "grid",
        slidesPerView: 3,
        itemsPerRow: "2",
        productsToShow: 4,
        arrowsColor: "secondary",
        arrowsShape: "rounded-sm",
        arrowsIcon: "arrow",
      },
    ],
  },
});
