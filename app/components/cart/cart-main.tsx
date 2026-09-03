import * as Dialog from "@radix-ui/react-dialog";
import { Money } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useRef, useState } from "react";
import useScroll from "react-use/esm/useScroll";
import { Link } from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { CartBestSellers } from "./cart-best-sellers";
import { CartLineItem, PriceLoadingSpinner } from "./cart-line-item";
import {
  AppliedCartCodes,
  CartCheckoutActions,
  CartDiscounts,
  CartPageTotals,
  CartProgression,
  CartSummary,
} from "./cart-summary";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";
import type { CartLayout, CartWithOptimistic } from "./cart-types";
import { getCartLineRenderKeys } from "./optimistic-cart";

export function CartMain({
  layout,
  onClose,
  cart,
}: {
  layout: CartLayout;
  onClose?: () => void;
  cart: CartWithOptimistic | null;
}) {
  const linesCount = Boolean(cart?.lines.nodes.length);
  const cartHasItems = Boolean(cart && cart.totalQuantity > 0);
  return cartHasItems && cart ? (
    <CartDetails cart={cart} layout={layout} />
  ) : (
    <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
  );
}

function CartDialogAction({
  label,
  layout,
  children,
}: {
  label: string;
  layout: CartLayout;
  children: (open: boolean, close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={clsx(
            layout === "page" ? "bg-white" : "bg-[#F0EFED]",
            "rounded-md px-3 py-2 text-sm",
          )}
        >
          {label}
        </button>
      </Dialog.Trigger>
      {children(open, () => setOpen(false))}
    </Dialog.Root>
  );
}

function CartDetails({
  layout,
  cart,
}: {
  layout: CartLayout;
  cart: CartWithOptimistic;
}) {
  const { t } = useTranslation();
  const {
    enableFreeShipping,
    enableCartNote,
    cartNoteButtonText,
    enableDiscountCode,
    discountCodeButtonText,
    enableGiftCard,
    giftCardButtonText,
  } = useThemeSettings();
  const { note, discountCodes, appliedGiftCards } = cart;
  const summaryActions = (enableCartNote ||
    enableDiscountCode ||
    enableGiftCard) && (
    <div className="flex flex-wrap items-center gap-2">
      {enableCartNote && (
        <CartDialogAction
          label={cartNoteButtonText || "Add a note"}
          layout={layout}
        >
          {(open, close) => (
            <NoteDialog
              cartNote={note ?? ""}
              open={open}
              onClose={close}
              layout={layout}
            />
          )}
        </CartDialogAction>
      )}
      {enableDiscountCode && (
        <CartDialogAction
          label={discountCodeButtonText || "Discount code"}
          layout={layout}
        >
          {(open, close) => (
            <DiscountDialog
              discountCodes={discountCodes}
              open={open}
              onClose={close}
              layout={layout}
            />
          )}
        </CartDialogAction>
      )}
      {enableGiftCard && (
        <CartDialogAction
          label={giftCardButtonText || "Giftcard"}
          layout={layout}
        >
          {(open, close) => (
            <GiftCardDialog open={open} onClose={close} layout={layout} />
          )}
        </CartDialogAction>
      )}
    </div>
  );

  if (layout === "drawer") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {enableFreeShipping && <CartProgression cost={cart.cost} />}
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] px-5">
          <div className="overflow-y-auto pr-2 pb-5">
            <CartLines
              discountCodes={discountCodes}
              lines={cart.lines.nodes}
              layout={layout}
            />
          </div>
          <CartSummary layout={layout}>
            <AppliedCartCodes
              appliedGiftCards={appliedGiftCards}
              discountCodes={discountCodes}
              layout={layout}
            />
            <div className="flex items-center justify-between font-medium">
              <span>{t("cart.subtotal")}</span>
              <span>
                {cart.isOptimistic ? (
                  <PriceLoadingSpinner />
                ) : cart.cost?.subtotalAmount?.amount ? (
                  <Money data={cart.cost.subtotalAmount} />
                ) : (
                  "-"
                )}
              </span>
            </div>
            <p className="text-[#918379] text-sm">
              {t("cart.shippingTaxesCheckout")}
            </p>
            <LoyaltyPointsHint amount={cart.cost?.subtotalAmount?.amount} />
            {summaryActions}
            <CartCheckoutActions
              checkoutUrl={cart.checkoutUrl}
              layout={layout}
            />
          </CartSummary>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start lg:gap-5 min-[1440px]:grid-cols-[900px_440px]">
        <div className="w-full">
          <CartLines
            discountCodes={discountCodes}
            lines={cart.lines.nodes}
            layout={layout}
          />
        </div>
        <CartSummary layout={layout}>
          <CartDiscounts
            appliedGiftCards={appliedGiftCards}
            discountCodes={discountCodes}
          />
          <CartPageTotals cart={cart} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
      </div>
    </div>
  );
}

function CartLines({
  layout = "drawer",
  lines,
  discountCodes,
}: {
  layout: CartLayout;
  lines: CartWithOptimistic["lines"]["nodes"];
  discountCodes: CartWithOptimistic["discountCodes"];
}) {
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  const renderKeys = getCartLineRenderKeys(lines);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        y > 0 && "border-line-subtle border-t",
        layout === "page" && "w-full",
        layout === "drawer" && "transition",
      )}
    >
      <ul
        className={clsx(
          layout === "page" && "flex flex-col gap-6",
          layout === "drawer" && "grid gap-5",
        )}
      >
        {lines.map((line, index) => (
          <CartLineItem
            key={renderKeys[index]}
            line={line}
            layout={layout}
            discountCodes={discountCodes}
          />
        ))}
      </ul>
    </div>
  );
}

function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: CartLayout;
  onClose?: () => void;
}) {
  const { cartTitleEmpty, buttonStartShopping, enableCartBestSellers } =
    useThemeSettings();
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "h-full min-h-0 w-full content-start space-y-12 overflow-y-auto px-5 pb-5 transition",
          y > 0 && "border-t",
        ],
        layout === "page" && [
          !hidden && "grid",
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
      {enableCartBestSellers && layout === "drawer" && (
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
