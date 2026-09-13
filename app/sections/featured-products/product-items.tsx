import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useTranslation,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowButton } from "~/components/arrow-button";
import { ProductCard } from "~/components/product/product-card";
import { translatePreview } from "~/utils/preview-translation";
import "swiper/css";
import "swiper/css/navigation";
import Link from "~/components/link";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { useFeaturedProductsLayout } from ".";

type ItemsPerRowType = "2" | "3" | "4" | "5";
type GapType = 8 | 12 | 16 | 20 | 24 | 28 | 32;

const productItemsVariants = cva("", {
  variants: {
    layout: {
      grid: "grid",
      carousel: "",
    },
    itemsPerRow: {
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "5": "grid-cols-5",
    },
    gap: {
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
  },
  compoundVariants: [
    {
      layout: "grid",
      gap: 8,
      className: "gap-2",
    },
    {
      layout: "grid",
      gap: 12,
      className: "gap-3",
    },
    {
      layout: "grid",
      gap: 16,
      className: "gap-4",
    },
    {
      layout: "grid",
      gap: 20,
      className: "gap-5",
    },
    {
      layout: "grid",
      gap: 24,
      className: "gap-6",
    },
    {
      layout: "grid",
      gap: 28,
      className: "gap-7",
    },
    {
      layout: "grid",
      gap: 32,
      className: "gap-8",
    },
  ],
  defaultVariants: {
    layout: "grid",
    itemsPerRow: "2",
    gap: 16,
  },
});

interface ProductItemsProps
  extends VariantProps<typeof productItemsVariants>,
    HydrogenComponentProps<Awaited<ReturnType<typeof loader>>> {
  collection: WeaverseCollection;
  layout?: "grid" | "carousel";
  slidesPerView?: number;
  itemsPerRow?: ItemsPerRowType;
  gap?: GapType;
  productsToShow?: number;
  arrowsColor?: "primary" | "secondary";
  arrowsShape?: "rounded-sm" | "circle" | "square";
  arrowsIcon?: "caret" | "arrow";
}

const ProductItems = forwardRef<HTMLDivElement, ProductItemsProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const {
      loaderData,
      collection,
      gap = 16,
      layout = "grid",
      slidesPerView = 4,
      itemsPerRow = "2" as ItemsPerRowType,
      productsToShow = 4,
      arrowsColor = "primary",
      arrowsShape = "rounded-sm",
      arrowsIcon = "arrow",
      ...rest
    } = props;
    const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);
    const {
      layout: sectionLayout,
      isLegacyLayout,
      isProductPage,
    } = useFeaturedProductsLayout();
    const activeLayout = isLegacyLayout ? layout : sectionLayout;
    const designGap = isLegacyLayout ? gap : 16;
    const resolvedSlidesPerView = isProductPage ? 3 : slidesPerView;

    // biome-ignore lint/correctness/useExhaustiveDependencies: Swiper must reset whenever its responsive layout inputs change.
    useEffect(() => {
      setIsSwiperInitialized(false);
    }, [activeLayout, gap, slidesPerView, itemsPerRow]);

    useEffect(() => {
      if (!isSwiperInitialized) {
        const fallbackTimer = setTimeout(() => {
          setIsSwiperInitialized(true);
        }, 500);
        return () => clearTimeout(fallbackTimer);
      }
    }, [isSwiperInitialized]);

    let productsConnection = loaderData?.products ?? [];

    // Show placeholders if no products available
    if (!productsConnection.length) {
      const placeholderCount =
        activeLayout === "grid"
          ? Math.max(Number(itemsPerRow), productsToShow)
          : slidesPerView;
      productsConnection = new Array(placeholderCount)
        .fill(null)
        .map((_, index) => ({
          ...translatePreview(t, PRODUCT_PLACEHOLDER),
          id: `placeholder-${index}`,
        }));
    }

    const totalProducts = loaderData?.products?.length ?? 0;
    const maxProductsToShow = productsToShow;
    const displayedProducts = productsConnection.slice(0, maxProductsToShow);
    const hasMoreProducts = totalProducts > maxProductsToShow;
    const isSingleProduct = displayedProducts.length === 1;

    const arrowColorClasses = useMemo(() => {
      return arrowsColor === "secondary"
        ? [
            "text-(--btn-secondary-text)",
            "bg-(--btn-secondary-bg)",
            "border-(--btn-secondary-bg)",
            "hover:text-(--btn-secondary-text-hover)",
            "hover:bg-(--btn-secondary-bg-hover)",
            "hover:border-(--btn-secondary-bg-hover)",
          ]
        : [
            "text-(--btn-primary-text)",
            "bg-(--btn-primary-bg)",
            "border-(--btn-primary-bg)",
            "hover:text-(--btn-primary-text-hover)",
            "hover:bg-(--btn-primary-bg-hover)",
            "hover:border-(--btn-primary-bg-hover)",
          ];
    }, [arrowsColor]);

    const arrowShapeClasses = useMemo(() => {
      if (arrowsShape === "circle") {
        return "rounded-full";
      }
      if (arrowsShape === "square") {
        return "";
      }
      return "rounded-(--radius-sm)";
    }, [arrowsShape]);

    const renderArrowControls = (classPrefix: string) => (
      <div className="flex justify-center gap-2">
        <ArrowButton
          tone="neutral"
          type="button"
          className={clsx(
            `${classPrefix}-prev`,
            "border p-4",
            arrowColorClasses,
            arrowShapeClasses,
          )}
          aria-label={t("product.previousProduct")}
        >
          {arrowsIcon === "caret" ? (
            <CaretLeft size={16} />
          ) : (
            <ArrowLeft size={16} />
          )}
        </ArrowButton>
        <ArrowButton
          tone="neutral"
          type="button"
          className={clsx(
            `${classPrefix}-next`,
            "border p-4",
            arrowColorClasses,
            arrowShapeClasses,
          )}
          aria-label={t("product.nextProduct")}
        >
          {arrowsIcon === "caret" ? (
            <CaretRight size={16} />
          ) : (
            <ArrowRight size={16} />
          )}
        </ArrowButton>
      </div>
    );

    const tabletCardClassName =
      "flex w-full flex-col items-start gap-5 [&>div:last-child]:pt-0";
    const desktopGridCols = {
      "2": "lg:grid-cols-2",
      "3": "lg:grid-cols-3",
      "4": "lg:grid-cols-4",
      "5": "lg:grid-cols-5",
    }[itemsPerRow ?? "2"];
    const desktopGridGap = {
      8: "lg:gap-2",
      12: "lg:gap-3",
      16: "lg:gap-4",
      20: "lg:gap-5",
      24: "lg:gap-6",
      28: "lg:gap-7",
      32: "lg:gap-8",
    }[designGap];

    const renderMobileSingleProduct = (
      product: (typeof displayedProducts)[number],
      quickShopIconOnlyOnTablet?: boolean,
    ) => (
      <div className="relative left-1/2 flex w-screen -translate-x-1/2 justify-center px-5 md:hidden">
        <div className="w-full">
          <ProductCard
            product={product}
            className="h-full w-full"
            quickShopIconOnlyOnTablet={quickShopIconOnlyOnTablet}
          />
        </div>
      </div>
    );

    if (activeLayout === "grid") {
      return (
        <div ref={ref} {...rest} className="relative">
          {isSingleProduct ? (
            renderMobileSingleProduct(displayedProducts[0])
          ) : (
            <div className="relative left-1/2 w-screen -translate-x-1/2 md:hidden">
              <Swiper
                key={`swiper-grid-mobile-${displayedProducts.length}`}
                slidesPerView="auto"
                centeredSlides
                centerInsufficientSlides
                spaceBetween={20}
                slidesOffsetBefore={20}
                slidesOffsetAfter={20}
                onSwiper={() => {
                  requestAnimationFrame(() => {
                    setIsSwiperInitialized(true);
                  });
                }}
                navigation={{
                  nextEl: ".featured-products-next",
                  prevEl: ".featured-products-prev",
                }}
                modules={[Navigation]}
                className={clsx(
                  "mb-6 w-full py-4 transition-opacity duration-300",
                  isSwiperInitialized ? "opacity-100" : "opacity-0",
                )}
              >
                {displayedProducts.map((product) => (
                  <SwiperSlide
                    key={product.id}
                    style={{ width: "calc(100vw - 80px)" }}
                  >
                    <div className="relative h-full">
                      <ProductCard
                        product={product}
                        className="h-full w-full"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {renderArrowControls("featured-products")}
            </div>
          )}

          <div className="hidden md:block">
            <div
              className={clsx(
                "grid grid-cols-2 gap-x-5 gap-y-16",
                desktopGridCols,
                desktopGridGap,
                "lg:gap-y-[86px]",
              )}
            >
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="w-full md:flex md:flex-col md:items-start md:gap-5 md:[&>div:last-child]:pt-0 lg:block lg:[&>div:last-child]:pt-5"
                  stretchImageOnTablet
                />
              ))}
            </div>

            {hasMoreProducts && (
              <div className="mt-16 flex justify-center">
                <Link
                  to="/products"
                  variant="outline"
                  className="font-semibold text-sm uppercase leading-none tracking-[0.02em]"
                >
                  {t("product.seeMoreProducts")}
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        {...rest}
        className={clsx("relative", isProductPage && "md:!mt-10 lg:!mt-16")}
      >
        {isSingleProduct ? (
          renderMobileSingleProduct(displayedProducts[0], isProductPage)
        ) : (
          <div className="relative left-1/2 w-screen -translate-x-1/2 md:hidden">
            <Swiper
              key={`swiper-carousel-mobile-${displayedProducts.length}`}
              slidesPerView="auto"
              centeredSlides
              centerInsufficientSlides
              spaceBetween={20}
              navigation={{
                nextEl: ".featured-products-carousel-mobile-next",
                prevEl: ".featured-products-carousel-mobile-prev",
              }}
              modules={[Navigation]}
              className={clsx(
                "mb-6 w-full py-4 transition-opacity duration-300",
                isSwiperInitialized ? "opacity-100" : "opacity-0",
              )}
              onSwiper={() => {
                requestAnimationFrame(() => setIsSwiperInitialized(true));
              }}
            >
              {displayedProducts.map((product) => (
                <SwiperSlide
                  key={product.id}
                  style={{ width: "calc(100vw - 40px)" }}
                >
                  <ProductCard
                    product={product}
                    className="h-full w-full"
                    quickShopIconOnlyOnTablet={isProductPage}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            {renderArrowControls("featured-products-carousel-mobile")}
          </div>
        )}

        <div className="hidden md:block lg:hidden">
          <Swiper
            key={`swiper-carousel-tablet-${displayedProducts.length}`}
            slidesPerView={3}
            spaceBetween={16}
            centerInsufficientSlides
            navigation={{
              nextEl: ".featured-products-carousel-tablet-next",
              prevEl: ".featured-products-carousel-tablet-prev",
            }}
            modules={[Navigation]}
            className={clsx("mb-6 w-full py-4", isProductPage && "md:py-0")}
            onSwiper={() => {
              requestAnimationFrame(() => setIsSwiperInitialized(true));
            }}
          >
            {displayedProducts.map((product) => (
              <SwiperSlide key={product.id} className="!h-auto">
                <ProductCard
                  product={product}
                  className={clsx(tabletCardClassName, "md:w-full")}
                  quickShopIconOnlyOnTablet={isProductPage}
                  stretchImageOnTablet
                />
              </SwiperSlide>
            ))}
          </Swiper>
          {renderArrowControls("featured-products-carousel-tablet")}
        </div>

        <div className="hidden lg:block">
          <Swiper
            key={`swiper-carousel-desktop-${resolvedSlidesPerView}-${designGap}`}
            slidesPerView={resolvedSlidesPerView || 3}
            centerInsufficientSlides
            spaceBetween={designGap}
            navigation={{
              nextEl: ".featured-products-carousel-desktop-next",
              prevEl: ".featured-products-carousel-desktop-prev",
            }}
            modules={[Navigation]}
            className={clsx(
              "mb-6 w-full py-4 transition-opacity duration-300",
              isProductPage && "md:py-0 lg:py-4",
              isSwiperInitialized ? "opacity-100" : "opacity-0",
            )}
            onSwiper={() => {
              requestAnimationFrame(() => setIsSwiperInitialized(true));
            }}
          >
            {displayedProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  product={product}
                  className="h-full w-full"
                  quickShopIconOnlyOnTablet={isProductPage}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          {renderArrowControls("featured-products-carousel-desktop")}
        </div>
      </div>
    );
  },
);

const PRODUCT_PLACEHOLDER = {
  id: "gid://shopify/Product/placeholder",
  title: "Product Title",
  handle: "product-placeholder",
  vendor: "Vendor",
  featuredImage: {
    id: "gid://shopify/ProductImage/placeholder",
    url: IMAGES_PLACEHOLDERS.product_1,
    altText: "Product placeholder",
    width: 1000,
    height: 1000,
  },
  images: {
    nodes: [
      {
        id: "gid://shopify/ProductImage/placeholder",
        url: IMAGES_PLACEHOLDERS.product_1,
        altText: "Product placeholder",
        width: 1000,
        height: 1000,
      },
    ],
  },
  badges: [],
  publishedAt: new Date().toISOString(),
  options: [],
  priceRange: {
    minVariantPrice: {
      amount: "0.00",
      currencyCode: "USD",
    },
    maxVariantPrice: {
      amount: "0.00",
      currencyCode: "USD",
    },
  },
  compareAtPriceRange: {
    minVariantPrice: {
      amount: "0.00",
      currencyCode: "USD",
    },
    maxVariantPrice: {
      amount: "0.00",
      currencyCode: "USD",
    },
  },
  variants: {
    nodes: [],
  },
  selectedOrFirstAvailableVariant: {
    id: "gid://shopify/ProductVariant/placeholder",
    title: "Default",
    availableForSale: true,
    selectedOptions: [],
    image: {
      id: "gid://shopify/ProductImage/placeholder",
      url: IMAGES_PLACEHOLDERS.product_1,
      altText: "Product placeholder",
      width: 1000,
      height: 1000,
    },
    price: {
      amount: "0.00",
      currencyCode: "USD",
    },
    compareAtPrice: null,
    product: {
      title: "Product Title",
      handle: "product-placeholder",
    },
  },
};

export default ProductItems;

const PRODUCTS_BY_COLLECTION_QUERY = `#graphql
  query productsByCollection(
    $handle: String!,
    $country: CountryCode,
    $language: LanguageCode
  )
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      handle
      products(first: 16) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const loader = async ({ weaverse, data }: ComponentLoaderArgs) => {
  const { language, country } = weaverse.storefront.i18n;
  const collectionHandle = data.collection?.handle;

  // Return empty products if no collection is selected
  if (!collectionHandle) {
    return { collection: data.collection, products: [] };
  }

  const res = await weaverse.storefront.query(PRODUCTS_BY_COLLECTION_QUERY, {
    variables: {
      handle: collectionHandle,
      country,
      language,
    },
  });
  const products = res?.collection?.products?.nodes ?? [];
  return { collection: data.collection, products };
};

export const schema = createSchema({
  type: "featured-products-items",
  title: "Products",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "collection",
          name: "collection",
          label: "Collection",
        },
        {
          type: "range",
          name: "slidesPerView",
          label: "Scenario 1: products per view (desktop)",
          configs: {
            min: 1,
            max: 6,
            step: 1,
          },
          defaultValue: 3,
        },
        {
          type: "select",
          name: "itemsPerRow",
          label: "Scenario 2: products per row (desktop)",
          configs: {
            options: [
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ],
          },
          defaultValue: "2",
        },
        {
          type: "range",
          name: "productsToShow",
          label: "Number of products to show",
          configs: {
            min: 1,
            max: 12,
            step: 1,
          },
          defaultValue: 4,
          helpText:
            "Maximum number of products to display. If more products are available, a 'See More Products' button will appear.",
        },
      ],
    },
    {
      group: "Arrows",
      inputs: [
        {
          type: "select",
          label: "Arrow icon",
          name: "arrowsIcon",
          helpText:
            "In Scenario 2, arrow settings apply to the mobile product slider only.",
          configs: {
            options: [
              { value: "caret", label: "Caret" },
              { value: "arrow", label: "Arrow" },
            ],
          },
          defaultValue: "arrow",
        },
        {
          type: "select",
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "arrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "rounded-sm",
        },
      ],
    },
  ],
  presets: {
    layout: "grid",
    slidesPerView: 3,
    itemsPerRow: "2",
    productsToShow: 4,
    arrowsColor: "secondary",
    arrowsShape: "rounded-sm",
    arrowsIcon: "arrow",
  },
});
