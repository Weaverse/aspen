import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { forwardRef, useMemo, useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductCard } from "~/components/product/product-card";
import "swiper/css";
import "swiper/css/navigation";
import Link from "~/components/link";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";

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
    layout: "carousel",
    itemsPerRow: "4",
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
}

const ProductItems = forwardRef<HTMLDivElement, ProductItemsProps>(
  (props, ref) => {
    const {
      loaderData,
      collection,
      gap = 16,
      layout = "carousel",
      slidesPerView = 4,
      itemsPerRow = "4" as ItemsPerRowType,
      productsToShow = 4,
      arrowsColor = "primary",
      arrowsShape = "rounded-sm",
      ...rest
    } = props;
    const [activeSlide, setActiveSlide] = useState(0);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);
    const productsConnection = loaderData?.products ?? [];
    const totalProducts = productsConnection.length;
    const maxProductsToShow = productsToShow;
    const displayedProducts = productsConnection.slice(0, maxProductsToShow);
    const hasMoreProducts = totalProducts > maxProductsToShow;

    const arrowColorClasses = useMemo(() => {
      return arrowsColor === "secondary"
        ? [
            "text-(--btn-secondary-text)",
            "bg-(--btn-secondary-bg)",
            "border-(--btn-secondary-bg)",
            "hover:text-(--btn-secondary-text)",
            "hover:bg-(--btn-secondary-bg)",
            "hover:border-(--btn-secondary-bg)",
          ]
        : [
            "text-(--btn-primary-text)",
            "bg-(--btn-primary-bg)",
            "border-(--btn-primary-bg)",
            "hover:text-(--btn-primary-text)",
            "hover:bg-(--btn-primary-bg)",
            "hover:border-(--btn-primary-bg)",
          ];
    }, [arrowsColor]);

    const arrowShapeClasses = useMemo(() => {
      if (arrowsShape === "circle") return "rounded-full";
      if (arrowsShape === "square") return "";
      return "rounded-md";
    }, [arrowsShape]);

    if (!productsConnection.length) {
      return (
        <div ref={ref} className="py-8 text-center text-gray-500">
          No products found.
        </div>
      );
    }

    if (layout === "grid") {
      return (
        <div ref={ref} {...rest} className="relative">
          <div className="md:hidden">
            <Swiper
              key={`swiper-grid-mobile-${gap}`}
              slidesPerView={1.2}
              centeredSlides={true}
              spaceBetween={gap}
              loop={true}
              onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
              navigation={{
                nextEl: ".featured-products-next",
                prevEl: ".featured-products-prev",
              }}
              modules={[Navigation]}
              className="mb-6 w-full py-4"
            >
              {displayedProducts.map((product) => (
                <SwiperSlide key={product.id}>
                  <div className="relative h-full">
                    <ProductCard product={product} className="h-full w-full" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="flex justify-center gap-2 md:hidden">
              <button
                type="button"
                className={clsx(
                  "featured-products-prev border p-4",
                  arrowColorClasses,
                  arrowShapeClasses,
                )}
                aria-label="Previous product"
              >
                <ArrowLeft className="" size={16} />
              </button>

              <button
                type="button"
                className={clsx(
                  "featured-products-next border p-4",
                  arrowColorClasses,
                  arrowShapeClasses,
                )}
                aria-label="Next product"
              >
                <ArrowRight className="" size={16} />
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <div
              className={clsx(
                "grid",
                productItemsVariants({ layout, itemsPerRow, gap }),
              )}
            >
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="h-full w-full"
                />
              ))}
            </div>

            {hasMoreProducts && (
              <div className="mt-8 flex justify-center">
                <Link to="/products" variant="outline" className="uppercase">
                  See More Products
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} {...rest} className="relative">
        <Swiper
          key={`swiper-carousel-${slidesPerView}-${gap}`}
          slidesPerView={1}
          spaceBetween={gap * 2}
          onSlideChange={(swiper) => {
            setActiveSlide(swiper.activeIndex);
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onSwiper={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          breakpoints={{
            640: {
              slidesPerView: Math.min(2, slidesPerView || 4),
              spaceBetween: gap * 2,
            },
            768: {
              slidesPerView: Math.min(3, slidesPerView || 4),
              spaceBetween: gap * 2.5,
            },
            1024: {
              slidesPerView: slidesPerView || 4,
              spaceBetween: gap * 3,
            },
          }}
          navigation={{
            nextEl: ".featured-products-next",
            prevEl: ".featured-products-prev",
          }}
          modules={[Navigation]}
          className="mb-6 w-full py-4"
        >
          {displayedProducts.map((product, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full">
                <ProductCard product={product} className="h-full" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={isBeginning}
            className={clsx(
              "featured-products-prev border p-4",
              arrowColorClasses,
              arrowShapeClasses,
              isBeginning ? "cursor-not-allowed opacity-50" : "opacity-100",
            )}
            aria-label="Previous product"
          >
            <ArrowLeft className="" size={16} />
          </button>

          <button
            type="button"
            disabled={isEnd}
            className={clsx(
              "featured-products-next border p-4",
              arrowColorClasses,
              arrowShapeClasses,
              isEnd ? "cursor-not-allowed opacity-50" : "opacity-100",
            )}
            aria-label="Next product"
          >
            <ArrowRight className="" size={16} />
          </button>
        </div>
      </div>
    );
  },
);

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
  const collectionHandle = data.collection.handle;
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
  title: "Product items",
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
          type: "select",
          name: "layout",
          label: "Display mode",
          configs: {
            options: [
              { value: "carousel", label: "Carousel" },
              { value: "grid", label: "Grid" },
            ],
          },
          defaultValue: "carousel",
        },
        {
          type: "range",
          name: "slidesPerView",
          label: "Products per view (Desktop)",
          configs: {
            min: 1,
            max: 6,
            step: 1,
          },
          defaultValue: 4,
          condition: (data) => data.layout === "carousel",
        },
        {
          type: "select",
          name: "itemsPerRow",
          label: "Products per row (Desktop)",
          configs: {
            options: [
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ],
          },
          defaultValue: "4",
          condition: (data) => data.layout === "grid",
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 8,
            max: 32,
            step: 4,
          },
          defaultValue: 16,
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
          label: "Arrows color",
          name: "arrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
          condition: (data: ProductItemsProps) => data.layout === "carousel",
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
          condition: (data: ProductItemsProps) => data.layout === "carousel",
        },
      ],
    },
  ],
});
