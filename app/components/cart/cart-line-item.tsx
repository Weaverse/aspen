import { Tag, X } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { SubscriptionLineItem } from "~/components/subscriptions/subscription-line-item";
import { getCartMutationError } from "~/utils/cart-error";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartLineQuantityAdjust } from "./cart-line-qty-adjust";
import type { CartLayout, CartLine } from "./cart-types";
import { useCartStore } from "./store";

export function CartLineItem({
  line,
  layout,
  discountCodes,
}: {
  line: CartLine;
  layout: CartLayout;
  discountCodes: Array<{ applicable: boolean; code: string }>;
}) {
  const { t } = useTranslation();
  if (!line?.id || typeof line.quantity === "undefined") {
    return null;
  }

  const { id, merchandise, isOptimistic } = line;
  if (!merchandise?.product) {
    return null;
  }

  const { image, title, product, selectedOptions } = merchandise;
  let url = `/products/${product.handle}`;
  if (selectedOptions?.length) {
    const params = new URLSearchParams();
    for (const option of selectedOptions) {
      params.append(option.name, option.value);
    }
    url += `?${params.toString()}`;
  }
  const isSynthetic = isOptimistic && id.startsWith("optimistic-");

  return (
    <li
      className={clsx(
        "relative transition-all duration-300",
        layout === "drawer"
          ? "flex gap-4"
          : "flex h-full flex-col items-center bg-white md:flex-row",
        isSynthetic && "pointer-events-none opacity-70",
      )}
    >
      <div
        className={clsx(
          layout === "drawer"
            ? "shrink-0"
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
                ? "h-auto w-[140px]"
                : "h-full w-full rounded",
            )}
            alt={title}
            aspectRatio={calculateAspectRatio(image, "1/1")}
          />
        )}
      </div>

      <div
        className={clsx(
          "flex flex-col",
          layout === "drawer"
            ? "grow justify-between"
            : "h-full w-full p-6 md:h-[360px]",
        )}
      >
        {layout === "page" ? (
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between gap-1">
                <div className="flex-1">
                  {product.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="line-clamp-1 font-semibold uppercase">
                        {product.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p className="line-clamp-1 font-semibold tracking-wide">
                      {product.title || ""}
                    </p>
                  )}
                </div>
                <ItemRemoveButton
                  lineId={id}
                  productTitle={product.title || title}
                  className="h-4 w-4"
                  layout={layout}
                  disabled={Boolean(isSynthetic)}
                />
              </div>
              <CartLineOptions selectedOptions={selectedOptions} />
            </div>

            <div className="space-y-3">
              <SubscriptionLineItem line={line as any} />
              <CartLineDiscountBadges
                discountCodes={discountCodes}
                line={line}
              />
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div>
                  {t("product.itemPrice")}:{" "}
                  <CartLinePrice
                    line={line}
                    amountType="unit"
                    as="span"
                    isLoading={Boolean(isOptimistic)}
                  />
                </div>
                <CartLineQuantityAdjust line={line} layout={layout} />
                <div className="justify-self-end font-medium">
                  <CartLinePrice
                    line={line}
                    amountType="total"
                    as="span"
                    isLoading={Boolean(isOptimistic)}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <div className="space-y-3">
                <div>
                  {product.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="line-clamp-1 font-semibold uppercase">
                        {product.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p>{product.title || ""}</p>
                  )}
                </div>
                <CartLineOptions selectedOptions={selectedOptions} />
                <SubscriptionLineItem line={line as any} className="mt-2" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <CartLineQuantityAdjust line={line} layout={layout} />
              <CartLinePrice
                line={line}
                amountType="total"
                as="span"
                isLoading={Boolean(isOptimistic)}
              />
            </div>
            <ItemRemoveButton
              lineId={id}
              productTitle={product.title || title}
              layout={layout}
              disabled={Boolean(isSynthetic)}
            />
          </>
        )}
      </div>
    </li>
  );
}

function CartLineOptions({
  selectedOptions,
}: {
  selectedOptions: CartLine["merchandise"]["selectedOptions"];
}) {
  const visibleOptions = selectedOptions.filter(
    (option) =>
      option.name.toLowerCase() !== "title" &&
      option.value.toLowerCase() !== "default title",
  );
  if (!visibleOptions.length) {
    return null;
  }
  return (
    <div className="flex flex-col font-normal">
      {visibleOptions.map((option) => (
        <span key={`${option.name}-${option.value}`}>
          {option.name} {option.value}
        </span>
      ))}
    </div>
  );
}

function CartLineDiscountBadges({
  line,
  discountCodes,
}: {
  line: CartLine;
  discountCodes: Array<{ applicable: boolean; code: string }>;
}) {
  const allocations = line.discountAllocations ?? [];
  const applicableCodes = discountCodes.filter(
    (discount) => discount.applicable,
  );
  if (!allocations.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {allocations.map((allocation, index) => {
        const label =
          ("code" in allocation && allocation.code) ||
          ("title" in allocation && allocation.title) ||
          applicableCodes[index]?.code ||
          "Discount";
        return (
          <span
            key={`${label}-${allocation.discountedAmount.amount}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#EBE8E5] px-2 py-1 text-[#574F49] text-xs"
          >
            <Tag size={13} aria-hidden="true" />
            {label} (-
            <Money data={allocation.discountedAmount} />)
          </span>
        );
      })}
    </div>
  );
}

function ItemRemoveButton({
  lineId,
  productTitle,
  className,
  layout,
  disabled,
}: {
  lineId: CartLine["id"];
  productTitle: string;
  className?: string;
  layout: CartLayout;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const mutationResponse = useCartStore((state) =>
    state.lineRemovalErrors.get(lineId),
  );
  const mutationError = getCartMutationError(mutationResponse, t);
  return (
    <div>
      <button
        className={clsx("flex items-center justify-center", className)}
        type="button"
        disabled={disabled}
        aria-label={t("cart.removeItem", { product: productTitle })}
        onClick={() => {
          useCartStore.getState().stageLineRemoval(lineId);
        }}
      >
        {layout === "page" && <X className="h-4 w-4" />}
        {layout === "drawer" && (
          <span className="uppercase underline">{t("cart.remove")}</span>
        )}
      </button>
      {mutationError && (
        <p className="mt-2 text-red-700 text-xs" role="alert">
          {mutationError}
        </p>
      )}
    </div>
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
        aria-hidden="true"
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

function CartLinePrice({
  line,
  amountType = "total",
  isLoading = false,
  ...passthroughProps
}: {
  line: CartLine;
  amountType?: "unit" | "total" | "compareAt";
  isLoading?: boolean;
  [key: string]: any;
}) {
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }
  const money =
    amountType === "unit"
      ? line.cost.amountPerQuantity
      : amountType === "compareAt"
        ? line.cost.compareAtAmountPerQuantity
        : line.cost.totalAmount;
  if (!money) {
    return null;
  }
  if (isLoading) {
    return <PriceLoadingSpinner className={passthroughProps.className} />;
  }
  return (
    <Money
      withoutTrailingZeros
      {...passthroughProps}
      data={money}
      className="mr-2 font-semibold"
    />
  );
}
