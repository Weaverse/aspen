import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ProductCard } from "~/components/product/product-card";
import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import "swiper/css";
import "swiper/css/navigation";
import { Button } from "~/components/button";

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

interface ProductItemsProps extends VariantProps<typeof productItemsVariants> {
  layout?: "grid" | "carousel";
  slidesPerView?: number;
  itemsPerRow?: ItemsPerRowType;
  gap?: GapType;
  initialProductsToShow?: number;
  productsPerLoad?: number;
}

const ProductItems = forwardRef<HTMLDivElement, ProductItemsProps>(
  (props, ref) => {
    const {
      gap = 16,
      layout = "carousel",
      slidesPerView = 4,
      itemsPerRow = "4" as ItemsPerRowType,
      initialProductsToShow = 4,
      productsPerLoad = 4,
      ...rest
    } = props;
    const parent = useParentInstance();
    const products = parent.data?.loaderData?.products;
    const [activeSlide, setActiveSlide] = useState(0);
    const [visibleProducts, setVisibleProducts] = useState(
      initialProductsToShow,
    );

    if (!products?.nodes?.length) {
      return null;
    }

    const totalProducts = products.nodes.length;
    const hasMoreProducts = visibleProducts < totalProducts;

    const handleLoadMore = () => {
      setVisibleProducts((prev) =>
        Math.min(prev + productsPerLoad, totalProducts),
      );
    };

    // For desktop view in grid layout
    if (layout === "grid") {
      return (
        <div ref={ref} {...rest} className="relative">
          {/* Mobile view (slide with peek effect) */}
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
              className="w-full py-4 mb-6"
            >
              {products.nodes.map((product) => (
                <SwiperSlide key={product.id}>
                  <div className="relative h-full">
                    <ProductCard product={product} className="w-full h-full" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation arrows for mobile */}
            <div className="flex gap-2 justify-center md:hidden">
              <button
                type="button"
                className={clsx(
                  "featured-products-prev rounded-full bg-[#EDEAE6] p-4",
                  activeSlide === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100",
                )}
                aria-label="Previous product"
              >
                <ArrowLeft className="" size={16} />
              </button>

              <button
                type="button"
                className="featured-products-next rounded-full bg-[#EDEAE6] p-4"
                aria-label="Next product"
              >
                <ArrowRight className="" size={16} />
              </button>
            </div>
          </div>

          {/* Desktop view (grid) */}
          <div className="hidden md:block">
            <div
              className={clsx(
                "grid",
                productItemsVariants({ layout, itemsPerRow, gap }),
              )}
            >
              {products?.nodes?.slice(0, visibleProducts).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="w-full h-full"
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreProducts && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} variant="outline">
                  See More Products ({totalProducts - visibleProducts}{" "}
                  remaining)
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Carousel layout
    return (
      <div ref={ref} {...rest} className="relative">
        <Swiper
          key={`swiper-carousel-${slidesPerView}-${gap}`}
          slidesPerView={1}
          spaceBetween={gap * 2}
          onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
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
          className="w-full py-4 mb-6"
        >
          {products.nodes.map((product, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full">
                <ProductCard product={product} className="h-full" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation arrows based on Figma design */}
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            className={clsx(
              "featured-products-prev rounded-full bg-[#EDEAE6] p-4",
              activeSlide === 0
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100",
            )}
            aria-label="Previous product"
          >
            <ArrowLeft className="" size={16} />
          </button>

          <button
            type="button"
            className="featured-products-next rounded-full bg-[#EDEAE6] p-4"
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

export const schema = createSchema({
  type: "featured-products-items",
  title: "Product items",
  settings: [
    {
      group: "Layout",
      inputs: [
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
          name: "initialProductsToShow",
          label: "Initial products to show",
          configs: {
            min: 2,
            max: 12,
            step: 1,
          },
          defaultValue: 4,
          condition: (data) => data.layout === "grid",
        },
        {
          type: "range",
          name: "productsPerLoad",
          label: "Products per load more",
          configs: {
            min: 1,
            max: 8,
            step: 1,
          },
          defaultValue: 4,
          condition: (data) => data.layout === "grid",
        },
      ],
    },
  ],
});
