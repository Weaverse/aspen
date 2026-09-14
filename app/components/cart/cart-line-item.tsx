import { Tag, X } from "@phosphor-icons/react";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { SubscriptionLineItem } from "~/components/subscriptions/subscription-line-item";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartLineQuantityAdjust } from "./cart-line-qty-adjust";
import { useCartMutation } from "./cart-mutation-context";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";
const cartCodeBadgeClassName =
  "flex items-center gap-2 bg-[var(--background-subtle-2-ui,#DFDFDF)] px-2 py-1 font-['DM_Sans'] text-[12px] font-normal not-italic leading-none tracking-[0.24px] text-[color:var(--Text-Subtle,#524B46)]";

export function CartLineItem({
  line,
  layout,
  discountCodes,
}: {
  line: CartLine;
  layout: Layouts;
  discountCodes: CartApiQueryFragment["discountCodes"];
}) {
  const { t } = useTranslation();

  if (!line?.id) {
    return null;
  }

  const { id, quantity, merchandise, isOptimistic } = line;

  if (typeof quantity === "undefined" || !merchandise?.product) {
    return null;
  }

  let { image, title, product, selectedOptions } = merchandise;
  let url = `/products/${product.handle}`;
  if (selectedOptions?.length) {
    let params = new URLSearchParams();
    for (const option of selectedOptions) {
      params.append(option.name, option.value);
    }
    url += `?${params.toString()}`;
  }

  return (
    <li
      className={clsx(
        "relative transition-all duration-300",
        layout === "drawer"
          ? "flex gap-4"
          : "flex h-full flex-col items-center md:flex-row",
        isOptimistic && "opacity-70",
        id.startsWith("optimistic-") && "pointer-events-none",
      )}
    >
      {/* Thumbnail */}
      <div
        className={clsx(
          layout === "drawer"
            ? "shrink-0 max-xl:w-[clamp(100px,32.56vw,140px)]"
            : "aspect-square w-full md:h-[360px] md:w-[360px] md:shrink-0",
        )}
      >
        {image && (
          <Image
            width={layout === "drawer" ? 140 : 360}
            height={layout === "drawer" ? 140 : 360}
            data={image}
            className={clsx(
              "!object-cover",
              layout === "drawer"
                ? "h-auto w-[140px] rounded-xl max-xl:aspect-square max-xl:h-full max-xl:max-h-[140px] max-xl:w-full"
                : "h-full w-full rounded",
            )}
            alt={title}
            aspectRatio={calculateAspectRatio(image, "1/1")}
          />
        )}
      </div>

      {/* Info Section */}
      <div
        className={clsx(
          "flex flex-col",
          layout === "drawer"
            ? "min-w-0 grow justify-between gap-2.5 max-xl:min-h-[140px] max-xl:text-sm"
            : "h-full w-full rounded-r-[var(--Radius-border-radius-md,12px)] bg-[var(--Background-Background,#FFF)] p-6 md:h-[360px]",
        )}
      >
        {layout === "page" ? (
          // Page Layout - New Design
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              {/* Title and Close Button */}
              <div className="mb-4 flex items-center justify-between gap-1">
                <div className="flex-1">
                  {product?.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="line-clamp-1 font-semibold uppercase">
                        {product?.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p className="line-clamp-1 font-semibold tracking-wide">
                      {product?.title || ""}
                    </p>
                  )}
                </div>
                <ItemRemoveButton
                  lineId={id}
                  productTitle={product?.title || title}
                  className="h-4 w-4"
                  layout={layout}
                />
              </div>

              {/* Variant Information */}
              <CartLineOptions selectedOptions={selectedOptions} showSize />
            </div>

            <div className="flex flex-col items-start gap-4">
              {/* Show applied discounts before the delivery plan and pricing. */}
              <CartLineDiscountBadges
                discountCodes={discountCodes}
                line={line}
              />
              <SubscriptionLineItem line={line as any} />

              {/* Quantity and Pricing */}
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
                <div>
                  {t("product.itemPrice")}:{" "}
                  <CartLinePrice
                    line={line}
                    amountType="unit"
                    fontWeight="normal"
                    as="span"
                    isLoading={isOptimistic}
                  />
                </div>
                <CartLineQuantityAdjust line={line} layout={layout} />
                <div className="justify-self-end font-normal">
                  <CartLinePrice
                    line={line}
                    amountType="total"
                    fontWeight="normal"
                    as="span"
                    isLoading={isOptimistic}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Drawer Layout - Original Design
          <>
            {/* Figma 512:13491 — title + variant, subscription pill, then the
                quantity/price row. REMOVE is pinned to the bottom of the row. */}
            <div className="flex min-h-0 flex-1 flex-col items-start gap-2">
              <div className="flex w-full flex-col gap-1">
                {product?.handle ? (
                  <Link
                    to={url}
                    className="w-full justify-start text-left max-xl:leading-5"
                    onClick={() => toggleCartDrawer(false)}
                  >
                    <span className="max-xl:line-clamp-2 xl:line-clamp-1 font-semibold uppercase">
                      {product?.title || ""}
                    </span>
                  </Link>
                ) : (
                  <p className="max-xl:line-clamp-2 xl:line-clamp-1 font-semibold uppercase">
                    {product?.title || ""}
                  </p>
                )}
                <CartLineOptions selectedOptions={selectedOptions} />
              </div>
              <SubscriptionLineItem
                line={line as any}
                className="max-xl:max-w-full"
              />
              <div className="flex w-full flex-wrap items-center gap-2 pt-1 max-xl:mt-auto">
                <CartLineQuantityAdjust line={line} layout={layout} />
                <CartLinePrice
                  line={line}
                  amountType="total"
                  as="span"
                  className="ml-auto"
                  isLoading={isOptimistic}
                />
              </div>
            </div>
            <ItemRemoveButton
              lineId={id}
              productTitle={product?.title || title}
              className="shrink-0 self-start"
              layout={layout}
            />
          </>
        )}
      </div>
    </li>
  );
}

export function CartLineOptions({
  selectedOptions,
  showSize = false,
}: {
  selectedOptions: CartLine["merchandise"]["selectedOptions"];
  showSize?: boolean;
}) {
  const visibleOptions = selectedOptions.filter(
    (option) =>
      [
        "color",
        "colour",
        "colors",
        "colours",
        ...(showSize ? ["size"] : []),
      ].includes(option.name.trim().toLowerCase()) &&
      option.value.toLowerCase() !== "default title",
  );

  if (!visibleOptions.length) {
    return null;
  }

  return (
    <div className="flex flex-col font-normal text-(--color-text-subtle)">
      {visibleOptions.map((option) => (
        <span key={`${option.name}-${option.value}`}>
          {option.name} {option.value}
        </span>
      ))}
    </div>
  );
}

export function CartLineDiscountBadges({
  line,
  discountCodes,
}: {
  line: CartLine;
  discountCodes: CartApiQueryFragment["discountCodes"];
}) {
  const { t } = useTranslation();

  const allocations = line.discountAllocations ?? [];
  const applicableCodes = discountCodes.filter(
    (discount) => discount.applicable,
  );

  if (!allocations.length) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {allocations.map((allocation, index) => {
        const label =
          ("code" in allocation && allocation.code) ||
          ("title" in allocation && allocation.title) ||
          applicableCodes[index]?.code ||
          t("cart.discount");

        return (
          <span
            key={`${label}-${allocation.discountedAmount.amount}-${index}`}
            className={clsx(
              cartCodeBadgeClassName,
              "rounded-[var(--Radius-border-radius-sm,8px)]",
            )}
          >
            <Tag size={16} className="shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">
              {label} (-
              <Money as="span" data={allocation.discountedAmount} />)
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ItemRemoveButton({
  lineId,
  productTitle,
  className,
  layout,
}: {
  lineId: CartLine["id"];
  productTitle: string;
  className?: string;
  layout: Layouts;
}) {
  const { t } = useTranslation();
  const { isPending, submitMutation } = useCartMutation();

  return (
    <button
      className={clsx("flex items-center justify-center", className)}
      type="button"
      disabled={isPending || lineId.startsWith("optimistic-")}
      aria-label={t("cart.removeItem", { product: productTitle })}
      onClick={() =>
        submitMutation(
          CartForm.ACTIONS.LinesRemove,
          { lineIds: [lineId] },
          { id: lineId, data: { action: "remove" } },
        )
      }
    >
      {layout === "page" && <X className="h-4 w-4" />}
      {layout === "drawer" && (
        <span className="text-xs uppercase underline underline-offset-2">
          {t("cart.remove")}
        </span>
      )}
    </button>
  );
}

export function PriceLoadingSpinner({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className="h-4 w-4 animate-spin text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-gray-400 text-sm">{t("cart.loading")}</span>
    </div>
  );
}

export function CartLinePrice({
  line,
  amountType = "total",
  isLoading = false,
  fontWeight = "semibold",
  ...passthroughProps
}: {
  line: CartLine;
  amountType?: "unit" | "total" | "compareAt";
  isLoading?: boolean;
  fontWeight?: "normal" | "semibold";
  [key: string]: any;
}) {
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }

  const moneyV2 =
    amountType === "unit"
      ? line.cost.amountPerQuantity
      : amountType === "compareAt"
        ? line.cost.compareAtAmountPerQuantity
        : line.cost.totalAmount;

  if (moneyV2 == null) {
    return null;
  }

  if (isLoading) {
    return <PriceLoadingSpinner className={passthroughProps.className} />;
  }

  return (
    <Money
      withoutTrailingZeros
      {...passthroughProps}
      data={moneyV2}
      className={clsx(
        fontWeight === "normal" ? "font-normal" : "font-semibold",
        passthroughProps.className,
      )}
    />
  );
}
