import { CaretDown, TrashIcon, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import type { Cart as CartType } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { SubscriptionLineItem } from "~/components/subscriptions/subscription-line-item";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";

export function Cart({
  layout,
  onClose,
  cart: originalCart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartApiQueryFragment;
}) {
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (cartHasItems) {
    return <CartDetails cart={cart} layout={layout} />;
  }
  return <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />;
}

// Dialog wrapper components with state management
function CartNoteDialogWrapper({
  cartNote,
  cartNoteButtonText,
  layout,
}: {
  cartNote: string;
  cartNoteButtonText: string;
  layout: Layouts;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            layout === "page" ? "bg-white" : "bg-[#F0EFED]",
            "px-3 py-2",
          )}
        >
          {cartNoteButtonText}
        </button>
      </Dialog.Trigger>
      <NoteDialog
        cartNote={cartNote}
        open={open}
        onClose={() => setOpen(false)}
        layout={layout}
      />
    </Dialog.Root>
  );
}

function DiscountCodeDialogWrapper({
  discountCodes,
  discountCodeButtonText,
  layout,
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  discountCodeButtonText: string;
  layout: Layouts;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            layout === "page" ? "bg-white" : "bg-[#F0EFED]",
            "px-3 py-2",
          )}
        >
          {discountCodeButtonText}
        </button>
      </Dialog.Trigger>
      <DiscountDialog
        discountCodes={discountCodes}
        open={open}
        onClose={() => setOpen(false)}
        layout={layout}
      />
    </Dialog.Root>
  );
}

function GiftCardDialogWrapper({
  appliedGiftCards,
  giftCardButtonText,
  layout,
}: {
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
  giftCardButtonText: string;
  layout: Layouts;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            layout === "page" ? "bg-white" : "bg-[#F0EFED]",
            "px-3 py-2",
          )}
        >
          {giftCardButtonText}
        </button>
      </Dialog.Trigger>
      <GiftCardDialog
        appliedGiftCards={appliedGiftCards}
        open={open}
        onClose={() => setOpen(false)}
        layout={layout}
      />
    </Dialog.Root>
  );
}

function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: OptimisticCart<CartApiQueryFragment>;
}) {
  let {
    enableFreeShipping,
    enableCartNote,
    cartNoteButtonText,
    enableDiscountCode,
    discountCodeButtonText,
    enableGiftCard,
    giftCardButtonText,
  } = useThemeSettings();

  const { note, discountCodes, appliedGiftCards, isOptimistic } = cart;

  // const isCartUpdating =
  //   isOptimistic ||
  //   dcRemoveFetcher.state !== "idle" ||
  //   gcRemoveFetcher.state !== "idle";

  return (
    <>
      {layout === "drawer" && enableFreeShipping && (
        <CartProgression cost={cart.cost} />
      )}
      <div
        className={clsx(
          layout === "drawer" && [
            "grid grid-cols-1 grid-rows-[1fr_auto] px-4",
            enableFreeShipping ? "h-[calc(100vh-100px)]" : "h-[100vh]",
          ],
          layout === "page" && ["flex flex-col gap-10 lg:flex-row lg:gap-5"],
        )}
      >
        <div
          className={clsx(
            layout === "drawer"
              ? `max-h-full overflow-y-auto pr-3 ${
                  enableFreeShipping ? "pb-5" : "pb-16"
                }`
              : "w-full lg:w-2/3",
          )}
        >
          <CartLines lines={cart?.lines?.nodes} layout={layout} />
        </div>
        <CartSummary
          cost={cart.cost}
          layout={layout}
          isOptimistic={isOptimistic}
        >
          {(enableCartNote || enableDiscountCode || enableGiftCard) && (
            <div className="mb-4 flex items-center justify-end gap-2">
              {enableCartNote && (
                <CartNoteDialogWrapper
                  cartNote={note}
                  layout={layout}
                  cartNoteButtonText={cartNoteButtonText || "Add a note"}
                />
              )}
              {enableDiscountCode && (
                <DiscountCodeDialogWrapper
                  discountCodes={discountCodes}
                  layout={layout}
                  discountCodeButtonText={
                    discountCodeButtonText || "Discount code"
                  }
                />
              )}
              {enableGiftCard && (
                <GiftCardDialogWrapper
                  layout={layout}
                  appliedGiftCards={appliedGiftCards}
                  giftCardButtonText={giftCardButtonText || "Giftcard"}
                />
              )}
            </div>
          )}
          {/* <CartDiscounts discountCodes={cart.discountCodes} /> */}
          {layout === "page" && (
            <>
              <div className="flex flex-col gap-6 border-line-subtle border-y py-6">
                <div className="flex items-center justify-between font-medium">
                  <span className="font-normal">Subtotal</span>
                  <span className="font-normal">
                    {isOptimistic ? (
                      <PriceLoadingSpinner />
                    ) : cart?.cost?.subtotalAmount?.amount ? (
                      <Money data={cart?.cost?.subtotalAmount} />
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
                <span className="font-normal text-[#918379]">
                  Shipping & taxes calculated at checkout
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  {isOptimistic ? (
                    <PriceLoadingSpinner />
                  ) : cart?.cost?.totalAmount?.amount ? (
                    <Money data={cart?.cost?.totalAmount} />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </>
          )}
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
      </div>
    </>
  );
}

function CartProgression({ cost }: { cost: CartApiQueryFragment["cost"] }) {
  let { freeShippingThreshold } = useThemeSettings();

  let subtotal = Number.parseFloat(cost?.subtotalAmount?.amount || "0");
  let threshold = Number.parseFloat(freeShippingThreshold || "100");
  let progress = Math.min((subtotal / threshold) * 100, 100);
  let amountRemaining = Math.max(threshold - subtotal, 0);
  return (
    <div className="flex w-full flex-col gap-2 rounded-lg px-6">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#F2F0EE]">
        <div
          className="h-full bg-[#A79D95] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-2 text-gray-700 text-sm">
        {amountRemaining > 0 ? (
          <>
            You're <b>${amountRemaining.toFixed(2)}</b> away from free shipping!
          </>
        ) : (
          "🎉 Congrats! You have free shipping!"
        )}
      </p>
    </div>
  );
}

/**
 * Temporary discount UI
 * @param discountCodes the current discount codes applied to the cart
 * @todo rework when a design is ready
 */
function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType["discountCodes"];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];

  return (
    <>
      {/* Have existing discount, display it with a remove option */}
      <dl className={codes && codes.length !== 0 ? "grid" : "hidden"}>
        <div className="flex items-center justify-between font-medium">
          <dt>Discount(s)</dt>
          <div className="flex items-center justify-between">
            <UpdateDiscountForm>
              <button type="button">
                <TrashIcon
                  aria-hidden="true"
                  className="mr-1 h-[18px] w-[18px]"
                />
              </button>
            </UpdateDiscountForm>
            <dd>{codes?.join(", ")}</dd>
          </div>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-3">
          <input
            className="h-[54px] grow rounded-none border border-line bg-white px-4 py-5 leading-tight!"
            type="text"
            name="discountCode"
            placeholder="Discount code"
          />
          <Button
            variant="outline"
            className="!px-6 !py-5 h-[54px] uppercase leading-tight!"
          >
            Apply
          </Button>
        </div>
      </UpdateDiscountForm>
    </>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = "drawer",
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartLine[];
}) {
  const currentLines = cartLines;
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);

  return (
    <div
      ref={scrollRef}
      className={clsx([
        y > 0 ? "border-line-subtle border-t" : "",
        layout === "page" && "w-full",
        layout === "drawer" && "transition",
      ])}
    >
      <ul
        className={clsx(
          layout === "page" && "flex flex-col gap-6",
          layout === "drawer" && "grid gap-5",
        )}
      >
        {currentLines.map((line, index) => (
          <CartLineItem
            key={line.id}
            line={line}
            layout={layout}
            isLastItem={index === currentLines.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}

function CartCheckoutActions({
  checkoutUrl,
  layout,
}: {
  checkoutUrl: string;
  layout: Layouts;
}) {
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* @todo: <CartShopPayButton cart={cart} /> */}
      {layout === "drawer" && (
        <Link
          variant="outline"
          to="/cart"
          className="flex h-[54px] w-full items-center justify-center uppercase"
        >
          View cart
        </Link>
      )}
      <a href={checkoutUrl} target="_self">
        <Button className="!px-6 !py-5 h-[54px] w-full">CHECKOUT</Button>
      </a>
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  isOptimistic = false,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartApiQueryFragment["cost"];
  layout: Layouts;
  isOptimistic?: boolean;
}) {
  return (
    <div
      className={clsx(
        layout === "drawer" &&
          "sticky bottom-0 grid gap-4 border-line-subtle border-t bg-white",
        layout === "page" &&
          "flex w-full flex-col gap-6 px-6 pb-6 md:mx-auto md:w-1/2 lg:mx-0 lg:w-1/3",
      )}
    >
      {layout === "page" && (
        <span className="border-line-subtle border-b pb-6 font-semibold uppercase">
          Order summary
        </span>
      )}
      {layout === "drawer" && (
        <dl className="grid">
          <div className="mt-5 flex items-center justify-between font-medium">
            <dt>Subtotal</dt>
            <dd>
              {isOptimistic ? (
                <PriceLoadingSpinner />
              ) : cost?.subtotalAmount?.amount ? (
                <Money data={cost?.subtotalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      )}
      {children}
    </div>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({
  line,
  layout,
  isLastItem,
}: {
  line: CartLine;
  layout: Layouts;
  isLastItem: boolean;
}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);

  if (!line?.id) return null;

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
          : "flex h-full flex-col items-center bg-white md:flex-row",
        isOptimistic && optimisticData?.action !== "remove" && "opacity-70",
        isOptimistic && "pointer-events-none",
        optimisticData?.action === "remove" &&
          "h-0 scale-95 overflow-hidden opacity-0",
      )}
    >
      {/* Loading Overlay - Only show for remove action */}
      {isOptimistic && optimisticData?.action === "remove" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <span className="text-gray-600 text-sm">Removing...</span>
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div
        className={clsx(
          layout === "drawer"
            ? "shrink-0"
            : "aspect-square w-full md:h-[360px] md:w-fit",
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

      {/* Info Section */}
      <div
        className={clsx(
          "flex flex-col",
          layout === "drawer"
            ? "grow justify-between"
            : "h-full w-full p-6 md:h-[360px]",
        )}
      >
        {layout === "page" ? (
          // Page Layout - New Design
          <div className="flex h-full flex-col justify-between">
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
                  className="h-4 w-4"
                  layout={layout}
                />
              </div>

              {/* Variant Information */}
              <div className="flex flex-col font-normal">
                {title.split(" / ").map((option, index) => (
                  <span key={index} className="">
                    {option.trim()}
                  </span>
                ))}
              </div>

              {/* Subscription Information */}
              <SubscriptionLineItem line={line as any} />
            </div>

            {/* Quantity and Pricing */}
            <div className="flex items-center justify-between">
              <div className="">
                Item price:{" "}
                <CartLinePrice line={line} as="span" isLoading={isOptimistic} />
              </div>
              <CartLineQuantityAdjust
                line={line}
                isLastItem={isLastItem}
                layout={layout}
              />
              <div className="font-medium">
                <CartLinePrice line={line} as="span" isLoading={isOptimistic} />
              </div>
            </div>
          </div>
        ) : (
          // Drawer Layout - Original Design
          <>
            <div className="flex justify-between gap-4">
              <div className="space-y-3">
                <div>
                  {product?.handle ? (
                    <Link to={url} onClick={() => toggleCartDrawer(false)}>
                      <span className="line-clamp-1 font-semibold uppercase">
                        {product?.title || ""}
                      </span>
                    </Link>
                  ) : (
                    <p>{product?.title || ""}</p>
                  )}
                </div>
                <div className="space-y-0.5 font-normal">{title}</div>
                {/* Subscription Information */}
                <SubscriptionLineItem line={line as any} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <CartLineQuantityAdjust
                line={line}
                isLastItem={isLastItem}
                layout={layout}
              />
              <CartLinePrice line={line} as="span" isLoading={isOptimistic} />
            </div>
            <ItemRemoveButton lineId={id} className="" layout={layout} />
          </>
        )}
      </div>
    </li>
  );
}

function ItemRemoveButton({
  lineId,
  className,
  layout,
}: {
  lineId: CartLine["id"];
  className?: string;
  layout: Layouts;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds: [lineId] }}
    >
      <button
        className={clsx("flex items-center justify-center", className)}
        type="submit"
      >
        {layout === "page" && <X className="h-4 w-4" />}
        {layout === "drawer" && (
          <span className="uppercase underline">Remove</span>
        )}
      </button>
      <OptimisticInput id={lineId} data={{ action: "remove" }} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({
  line,
  isLastItem,
  layout,
}: {
  line: CartLine;
  isLastItem: boolean;
  layout: Layouts;
}) {
  let optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const { id: lineId, isOptimistic } = line || {};

  // Always call hooks at the top level
  const quantities = [1, 2, 3, 4, 5];
  const optimisticQuantity = optimisticData?.quantity || line?.quantity || 1;
  const [selectedQty, setSelectedQty] = useState<number>(optimisticQuantity);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const prevOptimisticQtyRef = useRef<number>(optimisticQuantity);

  // Submit form when user intentionally changes quantity
  useEffect(() => {
    // Only submit if the change came from user action, not from syncing with optimistic updates
    if (
      selectedQty !== prevOptimisticQtyRef.current &&
      selectedQty !== optimisticQuantity
    ) {
      submitBtnRef.current?.click();
    }
  }, [selectedQty, optimisticQuantity]);

  // Keep local selected quantity in sync when optimistic quantity changes from server
  useEffect(() => {
    if (prevOptimisticQtyRef.current !== optimisticQuantity) {
      prevOptimisticQtyRef.current = optimisticQuantity;
      setSelectedQty(optimisticQuantity);
    }
  }, [optimisticQuantity]);

  // Early return after hooks
  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  // Ensure the select shows the actual quantity even if it's outside default options
  const optionValues = Array.from(
    new Set<number>([...quantities, optimisticQuantity, selectedQty]),
  ).sort((a, b) => a - b);

  return (
    <>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div className="quantity-selector relative">
        <Select.Root
          value={String(selectedQty)}
          onValueChange={(v) => setSelectedQty(Number(v))}
          disabled={isOptimistic}
        >
          <Select.Trigger
            className={clsx(
              "inline-flex min-w-[80px] items-center justify-between gap-2 bg-white outline-hidden",
              layout === "page" ? "" : "",
            )}
            aria-label="Select quantity"
          >
            <span
              className={clsx(layout === "page" ? "font-medium text-sm" : "")}
            >
              QTY
            </span>
            <span
              className={clsx(
                "flex-1 text-center",
                layout === "page" ? "text-sm" : "",
              )}
            >
              <Select.Value />
            </span>
            <Select.Icon className="shrink-0">
              <CaretDown className={clsx(layout === "page" ? "h-3 w-3" : "")} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
              <Select.Viewport className="p-1">
                {optionValues.map((quantity) => (
                  <Select.Item
                    key={quantity}
                    value={String(quantity)}
                    className="flex h-8 w-full cursor-pointer select-none items-center justify-center rounded px-3 py-1 outline-hidden hover:bg-gray-100"
                  >
                    <Select.ItemText>{quantity}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{
            lines: [{ id: lineId, quantity: selectedQty }],
          }}
        >
          <button ref={submitBtnRef} type="submit" className="hidden" />
          <OptimisticInput id={lineId} data={{ quantity: selectedQty }} />
        </CartForm>
      </div>
    </>
  );
}

function PriceLoadingSpinner({ className = "" }: { className?: string }) {
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
      <span className="text-gray-400 text-sm">Loading...</span>
    </div>
  );
}

function CartLinePrice({
  line,
  priceType = "regular",
  isLoading = false,
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: "regular" | "compareAt";
  isLoading?: boolean;
  [key: string]: any;
}) {
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) return null;

  const moneyV2 =
    priceType === "regular"
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

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
      className="mr-2 font-semibold"
    />
  );
}

function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  let { cartTitleEmpty, buttonStartShopping, enableCartBestSellers } =
    useThemeSettings();
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "h-screen-dynamic w-[400px] content-start space-y-12 overflow-y-scroll px-5 pb-5 transition",
          y > 0 ? "border-t" : "",
        ],
        layout === "page" && [
          hidden ? "" : "grid",
          "w-full gap-4 pb-12 md:items-start md:gap-8 lg:gap-12",
        ],
      )}
      hidden={hidden}
    >
      <div className={clsx(layout === "page" && "text-center")}>
        {cartTitleEmpty && <p className="mb-4">{cartTitleEmpty}</p>}
        {buttonStartShopping && (
          <Link
            to={layout === "page" ? "/products" : ""}
            className={clsx(layout === "drawer" ? "w-full" : "min-w-48")}
            onClick={onClose}
          >
            {buttonStartShopping}
          </Link>
        )}
      </div>
      {enableCartBestSellers && (
        <div className="grid gap-4">
          <CartBestSellers
            count={4}
            heading="Shop Best Sellers"
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      )}
    </div>
  );
}
