import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import type {
  Product,
  ProductSortKeys,
} from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useId, useMemo, useRef } from "react";
import { useFetcher } from "react-router";
import type { ProductCardFragment } from "storefront-api.generated";
import { ArrowButton } from "~/components/arrow-button";
import { Link } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { Skeleton } from "~/components/skeleton";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedText } from "~/hooks/use-translated-text";

interface CartBestSellersProps {
  count: number;
  heading: string;
  layout?: "drawer" | "page";
  query?: string;
  reverse?: boolean;
  sortKey: ProductSortKeys;
}

/**
 * Display a grid of products and a heading based on some options.
 * This components uses the storefront API products query
 * @param count number of products to display
 * @param query a filtering query
 * @param reverse wether to reverse the product results
 * @param sortKey Sort the underlying list by the given key.
 * @see query https://shopify.dev/api/storefront/current/queries/products
 * @see filters https://shopify.dev/api/storefront/current/queries/products#argument-products-query
 */
export function CartBestSellers({
  count = 4,
  heading: rawI18nHeading = "Shop Best Sellers",
  layout = "drawer",
  query,
  reverse,
  sortKey = "BEST_SELLING",
}: CartBestSellersProps) {
  const translateText = useTranslatedText();
  const heading = translateText(
    rawI18nHeading,
    "themeContent.componentsCartCartBestSellers.heading",
  );

  const { t } = useTranslation();
  const { load, data } = useFetcher<{ products: Product[] }>();
  const queryString = useMemo(
    () =>
      Object.entries({ count: count * 2, sortKey, query, reverse })
        .map(([key, val]) => (val ? `${key}=${val}` : null))
        .filter(Boolean)
        .join("&"),
    [count, sortKey, query, reverse],
  );
  const productsApiPath = usePrefixPathWithLocale(
    `/api/products?${queryString}`,
  );
  const productsPath = usePrefixPathWithLocale("/products");
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load(productsApiPath);
  }, [load, productsApiPath]);

  const scrollRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  if (layout === "page") {
    return (
      <div className="space-y-8 xl:space-y-10">
        <div className="flex items-center justify-between gap-4">
          <h4 className="whitespace-nowrap font-normal text-[clamp(16px,4.5vw,22px)] leading-[1.2] uppercase md:text-[28px]">
            {heading}
          </h4>
          <Link
            to={productsPath}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-normal! text-sm uppercase"
          >
            {t("product.viewAll")} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div
          ref={railRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-[9%] md:px-0"
        >
          <CartBestSellersContent
            count={count}
            layout={layout}
            products={data?.products as Product[]}
          />
        </div>
        <div className="flex justify-center gap-2">
          <ArrowButton
            type="button"
            onClick={() => scrollRail(-1)}
            tone="neutral"
            aria-label={t("product.previousRecommendations")}
          >
            <CaretLeft aria-hidden="true" />
          </ArrowButton>
          <ArrowButton
            type="button"
            onClick={() => scrollRail(1)}
            tone="neutral"
            aria-label={t("product.nextRecommendations")}
          >
            <CaretRight aria-hidden="true" />
          </ArrowButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <h5>{heading}</h5>
      <div
        className={clsx(
          "grid grid-cols-2 gap-x-4 gap-y-8",
          "[&_.bundle-badge,&_.new-badge,&_.best-seller-badge]:hidden",
        )}
      >
        <CartBestSellersContent
          count={count}
          layout={layout}
          products={data?.products as Product[]}
        />
      </div>
    </>
  );
}

/**
 * Render the CartBestSellers content based on the fetcher's state. "loading", "empty" or "products"
 */
function CartBestSellersContent({
  count = 4,
  products,
  layout = "drawer",
}: {
  count: CartBestSellersProps["count"];
  products: Product[] | undefined;
  layout?: CartBestSellersProps["layout"];
}) {
  const { t } = useTranslation();
  const id = useId();

  if (!products) {
    return (
      <>
        {[...new Array(count)].map((_, i) => (
          <div
            key={`${id + i}`}
            className={clsx(
              "grid gap-2",
              layout === "page" &&
                "w-full shrink-0 snap-center md:w-[calc((100%_-_32px)/3)] md:snap-start",
            )}
          >
            <Skeleton className="aspect-square" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </>
    );
  }

  if (products?.length === 0) {
    return <div>{t("product.noProducts")}</div>;
  }

  return products
    .filter((product) => product.images?.nodes?.length > 0)
    .slice(0, count)
    .map((product) => (
      <div
        key={product.id}
        className={clsx(
          layout === "page" &&
            "w-full shrink-0 snap-center md:w-[calc((100%_-_32px)/3)] md:snap-start",
        )}
      >
        <ProductCard
          product={product as unknown as ProductCardFragment}
          contentAlignment="left"
          quickShopIconOnly={layout === "drawer"}
        />
      </div>
    ));
}
