import * as Dialog from "@radix-ui/react-dialog";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useRef, useState } from "react";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Link } from "~/components/link";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { getCartMutationError } from "~/utils/cart-error";
import { CartBestSellers } from "./cart-best-sellers";
import { CartLineItem, PriceLoadingSpinner } from "./cart-line-item";
import {
  CartMutationContext,
  type CartMutationContextValue,
  useCartMutation,
} from "./cart-mutation-context";
import {
  AppliedCartCodes,
  CartCheckoutActions,
  CartDiscounts,
  CartPageTotals,
  CartProgression,
  CartSummary,
  getCartCodeDiscountAmounts,
  getCartDiscountTotal,
} from "./cart-summary";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";
import { getCartLineRenderKeys } from "./optimistic-cart";
import { useCartStore } from "./store";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";

export function CartMain({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: import("./cart-types").CartWithOptimistic | null;
}) {
  const { t } = useTranslation();
  const lastAddError = useCartStore((state) => state.lastAddError);
  const lineUpdateErrors = useCartStore((state) => state.lineUpdateErrors);
  const lineRemovalErrors = useCartStore((state) => state.lineRemovalErrors);
  const linesCount = Boolean(cart?.lines?.nodes?.length);
  const cartHasItems = Boolean(cart && cart.totalQuantity > 0);
  const errorMessage =
    lastAddError ||
    getCartMutationError(
      [...lineUpdateErrors.values(), ...lineRemovalErrors.values()][0],
      t,
    );
  const mutationContext: CartMutationContextValue = {
    errorMessage,
    isPending: false,
    pendingIdentifier: null,
    submitMutation(action, inputs) {
      if (action === CartForm.ACTIONS.LinesUpdate) {
        for (const line of inputs.lines as Array<{
          id: string;
          quantity: number;
        }>) {
          useCartStore.getState().stageLineUpdate(line.id, line.quantity);
        }
      } else if (action === CartForm.ACTIONS.LinesRemove) {
        for (const lineId of inputs.lineIds as string[]) {
          useCartStore.getState().stageLineRemoval(lineId);
        }
      }
    },
  };
  return (
    <CartMutationContext.Provider value={mutationContext}>
      {!cartHasItems && errorMessage && (
        <p role="alert" className="text-red-700 text-sm">
          {errorMessage}
        </p>
      )}
      {cartHasItems && cart ? (
        <CartDetails cart={cart} layout={layout} />
      ) : (
        <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      )}
    </CartMutationContext.Provider>
  );
}

export function CartNoteDialogWrapper({
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
            "rounded-lg px-3 py-2 font-semibold text-sm",
            layout === "drawer" && "max-xl:py-1.5",
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

export function DiscountCodeDialogWrapper({
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
            "rounded-lg px-3 py-2 font-semibold text-sm",
            layout === "drawer" && "max-xl:py-1.5",
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

export function GiftCardDialogWrapper({
  giftCardButtonText,
  layout,
}: {
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
            "rounded-lg px-3 py-2 font-semibold text-sm",
            layout === "drawer" && "max-xl:py-1.5",
          )}
        >
          {giftCardButtonText}
        </button>
      </Dialog.Trigger>
      <GiftCardDialog
        open={open}
        onClose={() => setOpen(false)}
        layout={layout}
      />
    </Dialog.Root>
  );
}

export function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: OptimisticCart<CartApiQueryFragment>;
}) {
  const { t } = useTranslation();
  let {
    enableFreeShipping,
    enableCartNote,
    cartNoteButtonText,
    enableDiscountCode,
    discountCodeButtonText,
    enableGiftCard,
    giftCardButtonText,
  } = useTranslatedThemeSettings();

  const { note, discountCodes, appliedGiftCards, isOptimistic } = cart;
  const { errorMessage } = useCartMutation();
  const drawerDiscountTotal = getCartDiscountTotal(cart.lines.nodes);
  const subtotalBeforeDiscounts =
    Number.parseFloat(cart.cost?.subtotalAmount?.amount || "0") +
    drawerDiscountTotal;

  const mutationError = errorMessage ? (
    <p className="bg-red-50 p-3 text-red-700 text-sm" role="alert">
      {errorMessage}
    </p>
  ) : null;

  const summaryActions = (enableCartNote ||
    enableDiscountCode ||
    enableGiftCard) && (
    <div className="flex flex-wrap items-center justify-end gap-2">
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
          discountCodeButtonText={discountCodeButtonText || "Discount code"}
        />
      )}
      {enableGiftCard && (
        <GiftCardDialogWrapper
          layout={layout}
          giftCardButtonText={giftCardButtonText || "Giftcard"}
        />
      )}
    </div>
  );

  if (layout === "drawer") {
    return (
      // Keep checkout visible while the line items scroll at every viewport.
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden max-xl:gap-6">
        {enableFreeShipping && !isOptimistic && (
          <CartProgression cost={cart.cost} />
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
            {mutationError}
            <CartLines
              discountCodes={discountCodes}
              lines={cart.lines.nodes}
              layout={layout}
            />
          </div>
          <CartSummary layout={layout} className="mt-auto">
            <AppliedCartCodes
              discountAmounts={getCartCodeDiscountAmounts(cart.lines.nodes)}
              appliedGiftCards={appliedGiftCards}
              discountCodes={discountCodes}
              layout={layout}
            />
            {/* Figma 3572:14579 — the pre-discount subtotal is struck through
                beside the amount actually payable. */}
            <div className="flex items-end gap-2.5 font-semibold">
              <span className="flex-1 text-base">{t("cart.subtotal")}</span>
              {isOptimistic ? (
                <PriceLoadingSpinner />
              ) : cart.cost?.subtotalAmount?.amount ? (
                <>
                  {drawerDiscountTotal > 0 && (
                    <span className="text-(--color-text-light) text-sm line-through">
                      <Money
                        data={{
                          amount: subtotalBeforeDiscounts.toString(),
                          currencyCode: cart.cost.subtotalAmount.currencyCode,
                        }}
                      />
                    </span>
                  )}
                  <span className="text-base">
                    <Money data={cart.cost.subtotalAmount} />
                  </span>
                </>
              ) : (
                "-"
              )}
            </div>
            {appliedGiftCards.length > 0 && (
              <div className="flex items-center justify-between font-semibold">
                <span>{t("cart.remainingToPay")}</span>
                {isOptimistic ? (
                  <PriceLoadingSpinner />
                ) : (
                  <Money data={cart.cost.totalAmount} />
                )}
              </div>
            )}
            <p className="text-(--color-text-light) text-sm">
              {t("cart.shippingTaxesCheckout")}
            </p>
            {summaryActions}
            <CartCheckoutActions
              checkoutUrl={cart.checkoutUrl}
              layout={layout}
              pending={isOptimistic}
            />
          </CartSummary>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mutationError}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start xl:gap-5 min-[1440px]:grid-cols-[900px_440px]">
        <div className="w-full">
          <CartLines
            discountCodes={discountCodes}
            lines={cart.lines.nodes}
            layout={layout}
          />
        </div>
        <CartSummary layout={layout}>
          <CartDiscounts
            lines={cart.lines.nodes}
            appliedGiftCards={appliedGiftCards}
            discountCodes={discountCodes}
          />
          <CartPageTotals cart={cart} isOptimistic={isOptimistic} />
          <CartCheckoutActions
            checkoutUrl={cart.checkoutUrl}
            layout={layout}
            pending={isOptimistic}
          />
        </CartSummary>
      </div>
    </div>
  );
}

export function CartLines({
  layout = "drawer",
  lines: cartLines,
  discountCodes,
}: {
  layout: Layouts;
  lines: CartLine[];
  discountCodes: CartApiQueryFragment["discountCodes"];
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
          layout === "drawer" && "grid gap-6",
        )}
      >
        {currentLines.map((line, index) => (
          <CartLineItem
            key={getCartLineRenderKeys(currentLines)[index]}
            line={line}
            layout={layout}
            discountCodes={discountCodes}
          />
        ))}
      </ul>
    </div>
  );
}

export function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const { t } = useTranslation();

  let { cartTitleEmpty, buttonStartShopping, enableCartBestSellers } =
    useTranslatedThemeSettings();
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "h-full min-h-0 w-full content-start space-y-12 overflow-y-auto transition",
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
      {enableCartBestSellers && layout === "drawer" && (
        <div className="grid gap-4">
          <CartBestSellers
            count={4}
            heading={t("cart.shopBestSellers")}
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      )}
    </div>
  );
}
