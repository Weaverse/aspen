import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { useRouteLoaderData } from "react-router";
import {
  CART_DRAWER_QUANTITY_SIZE_CLASS,
  DRAWER_LINE_BODY_CLASS,
  DRAWER_LINE_CLASS,
  DRAWER_LINE_IMAGE_CLASS,
  DRAWER_LINE_MEDIA_CLASS,
  DRAWER_LINE_TITLE_CLASS,
} from "~/components/cart/drawer-frame";
import { Image as ProductImage } from "~/components/image";
import Link from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import {
  CARD_BASE,
  CARD_CONTENT,
  CARD_CONTENT_HOVER,
  CARD_HOVER,
  CARD_IMAGE_FRAME,
  CARD_IMAGE_HOVER,
  CARD_IMAGE_ZOOM,
  CARD_TITLE,
  CONTENT_ALIGNMENT_CLASSES,
  useProductCardAppearance,
} from "~/components/product/product-card-appearance";
import { VariantPrices } from "~/components/product/variant-prices";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import { TABLET_MIN_PX } from "~/utils/breakpoints";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";
import type { hydrateThemivoItems } from "~/utils/themivo-products.server";
import { WishlistIcon } from "./wishlist-icon";

const PAGE_IMAGE_MAX_PX = 360;
const PAGE_IMAGE_SIZES = `auto, (min-width: ${TABLET_MIN_PX}px) min(${PAGE_IMAGE_MAX_PX}px, 33vw), 38vw`;

const LAYOUT_STORAGE_KEY = "aspen:themivo-wishlist-layout";
type Layout = "grid" | "list";

type Item = Awaited<ReturnType<typeof hydrateThemivoItems>>[number];

export function ThemivoWishlistItems({
  items,
  actions,
  purchaseAction,
  rowStyle,
  onAdded,
}: {
  items: Item[];
  actions?: (item: Item) => ReactNode;
  purchaseAction?: (item: Item) => ReactNode;
  rowStyle?: "drawer" | "popup" | "page";
  onAdded?: () => void;
}) {
  const t = useThemivoTranslation();
  const appearance = useRouteLoaderData<RootLoader>("root")?.themivoAppearance;
  const allowSwitch =
    rowStyle !== "drawer" && appearance?.allowLayoutSwitch === true;
  const [preferredLayout, setPreferredLayout] = useState<Layout>();
  useEffect(() => {
    if (allowSwitch) {
      try {
        const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (saved === "grid" || saved === "list") {
          setPreferredLayout(saved);
        }
      } catch {
        // The layout can still be changed when storage is unavailable.
      }
    }
  }, [allowSwitch]);
  const layout =
    rowStyle === "drawer"
      ? "list"
      : ((allowSwitch ? preferredLayout : undefined) ??
        appearance?.wishlistLayout ??
        (rowStyle ? "list" : "grid"));
  function chooseLayout(next: Layout) {
    setPreferredLayout(next);
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {
      // Keep the current choice for this view.
    }
  }
  if (!items.length) {
    return (
      <div className="flex flex-col items-start gap-3">
        {appearance?.emptyShowIcon && (
          <WishlistEmptyImage
            key={appearance.emptyImageUrl}
            src={appearance.emptyImageUrl}
          />
        )}
        <p>{t("wishlist.empty")}</p>
        {appearance?.emptyShowButton && (
          <Link to={appearance.emptyButtonPath ?? "/collections/all"}>
            {t("wishlist.continueShopping")}
          </Link>
        )}
      </div>
    );
  }
  return (
    <>
      {allowSwitch && (
        <fieldset className="flex gap-2">
          <legend className="sr-only">{t("wishlist.layout")}</legend>
          {(["grid", "list"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={layout === option}
              className="rounded-lg border border-line-subtle px-3 py-2 aria-pressed:border-line"
              onClick={() => chooseLayout(option)}
            >
              {t(option === "grid" ? "wishlist.grid" : "wishlist.list")}
            </button>
          ))}
        </fieldset>
      )}
      <ul
        data-wishlist-layout={layout}
        className={cn(
          "grid gap-6",
          layout === "grid" && "sm:grid-cols-2",
          layout === "grid" && "lg:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <WishlistItem
            key={`${item.productId}:${item.variantId}`}
            item={item}
            isList={layout === "list"}
            rowStyle={rowStyle}
            showPrice={appearance?.showPrice !== false}
            showAddToCart={appearance?.showAddToCart !== false}
            onAdded={onAdded}
            purchaseAction={purchaseAction}
          >
            {actions?.(item)}
          </WishlistItem>
        ))}
      </ul>
    </>
  );
}

function WishlistItem({
  item,
  children,
  isList,
  rowStyle,
  showPrice,
  showAddToCart,
  onAdded,
  purchaseAction,
}: {
  item: Item;
  children: ReactNode;
  isList: boolean;
  rowStyle?: "drawer" | "popup" | "page";
  showPrice: boolean;
  showAddToCart: boolean;
  purchaseAction?: (item: Item) => ReactNode;
  onAdded?: () => void;
}) {
  const t = useThemivoTranslation();
  const options = new URLSearchParams(
    item.selectedOptions?.map(({ name, value }) => [name, value]),
  );
  const productPath = usePrefixPathWithLocale(
    `/products/${item.handle}${options.size ? `?${options}` : ""}`,
  );
  const variant = item.selectedOptions?.some(({ name }) => name !== "Title")
    ? item.selectedOptions.map(({ value }) => value).join(" / ")
    : null;
  const purchase = purchaseAction ? (
    purchaseAction(item)
  ) : showAddToCart && item.merchandiseId ? (
    <AddToCartButton
      lines={[{ merchandiseId: item.merchandiseId, quantity: item.quantity }]}
      width={isList ? "auto" : "full"}
      className={cn(
        rowStyle === "drawer" && "px-3 py-2 text-xs",
        isList &&
          rowStyle &&
          rowStyle !== "drawer" && [
            CART_DRAWER_QUANTITY_SIZE_CLASS,
            "px-0! py-0! text-xs",
          ],
      )}
      cartOpenTiming={onAdded ? "manual" : undefined}
      onAdded={onAdded}
    >
      {t("wishlist.itemAddToCart", undefined, "product.addToCart")}
    </AddToCartButton>
  ) : isList ? (
    <Link to={productPath}>{t("wishlist.viewProduct")}</Link>
  ) : null;

  const prices = showPrice && item.price && (
    <VariantPrices
      variant={{ price: item.price, compareAtPrice: item.compareAtPrice }}
      compareAtFirst
      spacedCurrency
      compareAtPriceClassName="text-(--color-compare-price-text) line-through"
      className={cn(
        "flex-wrap",
        rowStyle && isList && "ml-auto",
        !isList &&
          "gap-1 font-body font-normal text-(--color-text) text-(length:--pcard-font-size) leading-none tracking-[0.02em]",
      )}
    />
  );

  if (!isList) {
    return (
      <WishlistGridItem item={item} productPath={productPath} variant={variant}>
        {prices}
        {purchase}
        {children}
      </WishlistGridItem>
    );
  }

  if (rowStyle) {
    const page = rowStyle === "page";
    const stretchImage = rowStyle !== "drawer";
    return (
      <li
        className={cn(
          DRAWER_LINE_CLASS,
          page && "gap-0 overflow-hidden rounded-(--radius-md) bg-background",
        )}
      >
        <Link
          to={productPath}
          aria-label={item.title}
          style={
            page
              ? ({
                  "--wishlist-page-image-max": `${PAGE_IMAGE_MAX_PX}px`,
                } as CSSProperties)
              : undefined
          }
          className={cn(
            "block",
            DRAWER_LINE_MEDIA_CLASS,
            stretchImage &&
              "relative h-auto! min-h-35 w-35 self-stretch! overflow-hidden",
            page &&
              "w-[38%] rounded-none max-md:flex-none md:min-h-64 md:w-1/3 md:max-w-(--wishlist-page-image-max) lg:min-h-80",
          )}
        >
          {item.image && (
            <Image
              width={page ? PAGE_IMAGE_MAX_PX : 140}
              height={page ? PAGE_IMAGE_MAX_PX : 140}
              className={cn(
                "object-cover",
                DRAWER_LINE_IMAGE_CLASS,
                stretchImage &&
                  "absolute inset-0 size-full max-h-none! rounded-(--radius-md)",
                page && "rounded-none! max-md:rounded-none!",
              )}
              data={item.image}
              alt={item.image.altText ?? item.title}
              sizes={page ? PAGE_IMAGE_SIZES : "140px"}
              loading="lazy"
            />
          )}
        </Link>
        <div
          className={cn(
            "flex flex-col",
            page
              ? "min-w-0 flex-1 justify-between gap-4 p-4 md:p-6"
              : DRAWER_LINE_BODY_CLASS,
          )}
        >
          <div className="flex w-full flex-col gap-1">
            <Link
              to={productPath}
              className="w-full justify-start text-left max-xl:leading-5"
            >
              <span className={DRAWER_LINE_TITLE_CLASS}>{item.title}</span>
            </Link>
            {variant && (
              <span className="text-body-subtle text-xs">{variant}</span>
            )}
          </div>
          <div className="flex flex-col items-start gap-4 max-md:mt-auto max-md:gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
              {purchase}
              {prices}
            </div>
            {children}
          </div>
        </div>
      </li>
    );
  }

  const image = item.image && (
    <Image
      aspectRatio="1/1"
      className="w-full rounded-lg object-cover"
      data={item.image}
      alt={item.image.altText ?? item.title}
      sizes="96px"
      loading="lazy"
    />
  );
  return (
    <li className="flex items-start gap-3 border-line-subtle border-b pb-4">
      {image && (
        <Link
          to={productPath}
          aria-label={item.title}
          className="w-20 shrink-0 sm:w-24"
        >
          {image}
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link to={productPath} className="flex flex-col gap-3">
          <span className="font-semibold">{item.title}</span>
          {variant && (
            <span className="text-body-subtle text-sm">{variant}</span>
          )}
        </Link>
        {prices}
        {purchase}
        {children}
      </div>
    </li>
  );
}

function WishlistGridItem({
  item,
  productPath,
  variant,
  children,
}: {
  item: Item;
  productPath: string;
  variant: string | null;
  children: ReactNode;
}) {
  const { pcardAlignment = "left", pcardImageRatio } = useThemeSettings();
  const { cardStyle, pcardImageZoom } = useProductCardAppearance(
    calculateAspectRatio(item.image ?? {}, pcardImageRatio) ?? "1/1",
  );

  return (
    <li className={cn(CARD_BASE, CARD_HOVER, "min-w-0")} style={cardStyle}>
      <div className="relative aspect-(--pcard-image-ratio)">
        <div className={cn(CARD_IMAGE_FRAME, CARD_IMAGE_HOVER)}>
          <Link
            to={productPath}
            prefetch="intent"
            aria-label={item.title}
            className="block size-full overflow-hidden rounded-(--pcard-radius) bg-gray-100"
          >
            {item.image && (
              <ProductImage
                className={cn(
                  "[&>img]:transition-transform [&>img]:duration-300",
                  pcardImageZoom && CARD_IMAGE_ZOOM,
                )}
                data={item.image}
                alt={item.image.altText ?? item.title}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                width={700}
                loading="lazy"
              />
            )}
          </Link>
        </div>
      </div>
      <div
        className={cn(
          CARD_CONTENT,
          CARD_CONTENT_HOVER,
          CONTENT_ALIGNMENT_CLASSES[
            pcardAlignment as keyof typeof CONTENT_ALIGNMENT_CLASSES
          ],
        )}
      >
        <Link to={productPath} prefetch="intent" className={CARD_TITLE}>
          {item.title}
        </Link>
        {variant && <span className="text-body-subtle text-xs">{variant}</span>}
        {children}
      </div>
    </li>
  );
}

function WishlistEmptyImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <Image
      src={src}
      alt=""
      width={128}
      height={128}
      className="size-32 rounded-lg object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <WishlistIcon className="size-6" />
  );
}
