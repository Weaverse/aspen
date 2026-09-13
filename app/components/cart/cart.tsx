import { CaretDown, Tag, Truck, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  CartForm,
  Money,
  type OptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useFetcher } from "react-router";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { CART_CODE_APPLY_ACTION } from "~/components/cart/cart-actions";
import {
  CartResponseSync,
  useSyncCartResponse,
} from "~/components/cart/cart-state-provider";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { SubscriptionLineItem } from "~/components/subscriptions/subscription-line-item";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { getCartMutationError } from "~/utils/cart-error";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";
import { getCartLineRenderKeys } from "./optimistic-cart";
import { useCart, useCartStore } from "./store";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";
const cartCodeBadgeClassName =
  "flex items-center gap-2 bg-[var(--background-subtle-2-ui,#DFDFDF)] px-2 py-1 font-['DM_Sans'] text-[12px] font-normal not-italic leading-none tracking-[0.24px] text-[color:var(--Text-Subtle,#524B46)]";
type OptimisticData = {
  action?: string;
  quantity?: number;
};

type CartMutationResponse = {
  cart?: CartApiQueryFragment | null;
  errors?: Array<{ message?: string }>;
  userErrors?: Array<{ message?: string }>;
};

type CartMutationContextValue = {
  errorMessage: string | null;
  isPending: boolean;
  pendingIdentifier: string | null;
  submitMutation: (
    action: string,
    inputs: Record<string, unknown>,
    optimistic?: { id: string; data: OptimisticData },
  ) => void;
};

const CartMutationContext = createContext<CartMutationContextValue | null>(
  null,
);

function useCartMutation() {
  const context = useContext(CartMutationContext);
  if (!context) {
    throw new Error("useCartMutation must be used within Cart");
  }
  return context;
}

export function Cart({
  layout,
  onClose,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart?: CartApiQueryFragment;
}) {
  const { t } = useTranslation();
  const cart = useCart();
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
      {cartHasItems ? (
        <CartDetails cart={cart!} layout={layout} />
      ) : (
        <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      )}
    </CartMutationContext.Provider>
  );
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

function GiftCardDialogWrapper({
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

function CartDetails({
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

function CartProgression({ cost }: { cost: CartApiQueryFragment["cost"] }) {
  const { t } = useTranslation();
  let { freeShippingThreshold } = useTranslatedThemeSettings();

  let subtotal = Number.parseFloat(cost?.subtotalAmount?.amount || "0");
  const configuredThreshold = Number.parseFloat(freeShippingThreshold || "100");
  let threshold =
    Number.isFinite(configuredThreshold) && configuredThreshold > 0
      ? configuredThreshold
      : 100;
  let progress = Math.min((subtotal / threshold) * 100, 100);
  let amountRemaining = Math.max(threshold - subtotal, 0);
  const amountToken = "__CART_AMOUNT__";
  const [freeShippingPrefix, freeShippingSuffix] = t(
    "cart.freeShippingRemaining",
    { amount: amountToken },
  ).split(amountToken);
  return (
    <div className="flex w-full shrink-0 flex-col gap-2">
      {/* Figma 512:13480 — the message lives inside a filled pill. */}
      <div className="flex items-center gap-2 self-stretch rounded-xl bg-(--color-background-subtle) px-4 py-2 text-(--color-text-subtle) text-sm max-xl:order-2 max-xl:rounded-none max-xl:bg-transparent max-xl:p-0">
        <Truck aria-hidden="true" className="size-4 shrink-0 max-xl:hidden" />
        {/* `Money` renders a <div> unless told otherwise, which would break the
            sentence onto its own line inside the pill. */}
        <p className="min-w-0 flex-1 text-pretty break-words">
          {amountRemaining > 0 ? (
            <>
              {freeShippingPrefix}
              <Money
                as="b"
                className="whitespace-nowrap font-semibold"
                withoutTrailingZeros
                data={{
                  amount: amountRemaining.toString(),
                  currencyCode: cost.subtotalAmount.currencyCode,
                }}
              />
              {freeShippingSuffix}
            </>
          ) : (
            t("cart.freeShippingUnlocked")
          )}
        </p>
      </div>
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#F2F0EE] max-xl:order-1 max-xl:rounded-none max-xl:bg-[#ECECEC]">
        <div
          className="h-full bg-[#A79D95] transition-all duration-300 max-xl:bg-[#9B9B9B]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CartDiscounts({
  lines,
  discountCodes,
  appliedGiftCards,
}: {
  lines: CartLine[];
  discountCodes: CartApiQueryFragment["discountCodes"];
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
}) {
  const discountAmounts = getCartCodeDiscountAmounts(lines);
  return (
    <div className="space-y-4">
      <CartCodeForm />
      <AppliedCartCodes
        discountAmounts={discountAmounts}
        appliedGiftCards={appliedGiftCards}
        discountCodes={discountCodes}
        layout="page"
      />
    </div>
  );
}

function getCartCodeDiscountAmounts(lines: CartLine[]) {
  const discountAmounts: Record<
    string,
    {
      amount: string;
      currencyCode: CartLine["cost"]["totalAmount"]["currencyCode"];
    }
  > = {};
  for (const line of lines) {
    for (const allocation of line.discountAllocations ?? []) {
      if ("code" in allocation && allocation.code) {
        const key = allocation.code.toLowerCase();
        discountAmounts[key] = {
          currencyCode: allocation.discountedAmount.currencyCode,
          amount: String(
            Number(discountAmounts[key]?.amount ?? 0) +
              Number(allocation.discountedAmount.amount),
          ),
        };
      }
    }
  }
  return discountAmounts;
}

function CartCodeForm() {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<{
    cartCodeApplied?: boolean;
    errors?: Array<{ message?: string }>;
    userErrors?: Array<{ message?: string }>;
  }>({ key: "cart-code-apply" });
  useSyncCartResponse(fetcher);
  const errorMessage =
    getCartMutationError(fetcher.data, t) ||
    (fetcher.data?.cartCodeApplied === false ? t("cart.invalidCode") : null);

  return (
    <fetcher.Form method="post" action={cartRoute}>
      <input
        type="hidden"
        name={CartForm.INPUT_NAME}
        value={JSON.stringify({
          action: CART_CODE_APPLY_ACTION,
          inputs: {},
        })}
      />
      <div className="flex items-stretch gap-3">
        <label htmlFor="cart-page-discount" className="sr-only">
          {t("cart.code")}
        </label>
        <input
          id="cart-page-discount"
          className="h-[54px] min-w-0 grow rounded-lg border border-line bg-white px-4 leading-tight! outline-none focus:border-gray-700"
          type="text"
          name="discountCode"
          placeholder={t("cart.code")}
          required
        />
        <Button
          variant="outline"
          type="submit"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
          className="!px-6 !py-0 h-[54px] shrink-0 rounded-lg leading-tight!"
        >
          {t("cart.apply")}
        </Button>
      </div>
      {errorMessage && (
        <p className="mt-2 bg-red-50 p-3 text-red-700 text-sm" role="alert">
          {errorMessage}
        </p>
      )}
    </fetcher.Form>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  return (
    <CartForm
      route={cartRoute}
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function AppliedCartCodes({
  discountAmounts = {},
  discountCodes,
  appliedGiftCards,
  layout,
}: {
  discountAmounts?: Record<
    string,
    {
      amount: string;
      currencyCode: CartLine["cost"]["totalAmount"]["currencyCode"];
    }
  >;
  discountCodes: CartApiQueryFragment["discountCodes"];
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
  layout: Layouts;
}) {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const applicableDiscountCodes = discountCodes.filter(
    (discount) => discount.applicable,
  );

  if (!(applicableDiscountCodes.length || appliedGiftCards.length)) {
    return null;
  }

  return (
    <ul
      className={clsx(
        "flex flex-wrap gap-2",
        layout === "drawer" ? "justify-end" : "justify-start",
      )}
      aria-label={t("cart.appliedCodes")}
    >
      {applicableDiscountCodes.map((discount) => (
        <li key={discount.code}>
          <CartForm
            route={cartRoute}
            action={CartForm.ACTIONS.DiscountCodesUpdate}
            inputs={{
              discountCodes: applicableDiscountCodes
                .filter((item) => item.code !== discount.code)
                .map((item) => item.code),
            }}
          >
            {(fetcher) => (
              <>
                <CartResponseSync fetcher={fetcher} />
                <div className={cartCodeBadgeClassName}>
                  <Tag size={16} aria-hidden="true" className="shrink-0" />
                  <span className="whitespace-nowrap">
                    {discount.code}
                    {layout === "page" &&
                      discountAmounts[discount.code.toLowerCase()] && (
                        <>
                          {" "}
                          (-
                          <Money
                            as="span"
                            data={discountAmounts[discount.code.toLowerCase()]}
                          />
                          )
                        </>
                      )}
                  </span>
                  <button
                    type="submit"
                    className="flex h-4 w-4 shrink-0 items-center justify-center"
                    aria-label={t("cart.removeDiscountCode", {
                      code: discount.code,
                    })}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </CartForm>
        </li>
      ))}
      {appliedGiftCards.map((giftCard) => (
        <li key={giftCard.id}>
          <GiftCardRemoveForm giftCardId={giftCard.id}>
            {(pending) => (
              <>
                <div className={cartCodeBadgeClassName}>
                  <Tag size={16} aria-hidden="true" className="shrink-0" />
                  <span className="whitespace-nowrap">
                    •••• {giftCard.lastCharacters}
                    {layout === "page" && (
                      <>
                        {" "}
                        (-
                        <Money as="span" data={giftCard.amountUsed} />)
                      </>
                    )}
                  </span>
                  <button
                    type="submit"
                    disabled={pending}
                    aria-busy={pending}
                    className="flex h-4 w-4 items-center justify-center"
                    aria-label={t("cart.removeGiftCard", {
                      digits: giftCard.lastCharacters,
                    })}
                  >
                    {pending ? (
                      <PriceLoadingSpinner />
                    ) : (
                      <X size={12} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </>
            )}
          </GiftCardRemoveForm>
        </li>
      ))}
    </ul>
  );
}

function GiftCardRemoveForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: (pending: boolean) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<CartMutationResponse>();
  useSyncCartResponse(fetcher);
  const pending = fetcher.state !== "idle";
  const error = getCartMutationError(fetcher.data, t);
  return (
    <fetcher.Form method="post" action={cartRoute}>
      <input
        type="hidden"
        name={CartForm.INPUT_NAME}
        value={JSON.stringify({
          action: CartForm.ACTIONS.GiftCardCodesRemove,
          inputs: { appliedGiftCardIds: [giftCardId] },
        })}
      />
      {children(pending)}
      {!pending && error && (
        <p role="alert" className="mt-2 text-red-700 text-sm">
          {error}
        </p>
      )}
    </fetcher.Form>
  );
}

function getCartDiscountTotal(
  lines: OptimisticCart<CartApiQueryFragment>["lines"]["nodes"],
) {
  return lines.reduce(
    (cartTotal, line) =>
      cartTotal +
      (line.discountAllocations ?? []).reduce(
        (lineTotal, allocation) =>
          lineTotal + Number.parseFloat(allocation.discountedAmount.amount),
        0,
      ),
    0,
  );
}

function CartPageTotals({
  cart,
  isOptimistic,
}: {
  cart: OptimisticCart<CartApiQueryFragment>;
  isOptimistic: boolean;
}) {
  const { t } = useTranslation();
  const discountTotal = getCartDiscountTotal(cart.lines.nodes);
  const currencyCode = cart.cost.subtotalAmount.currencyCode;
  const subtotalAfterDiscounts = Number.parseFloat(
    cart.cost.subtotalAmount.amount,
  );
  const subtotalBeforeDiscounts = subtotalAfterDiscounts + discountTotal;

  return (
    <>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex items-center justify-between">
          <span>{t("cart.subtotal")}</span>
          <span className="shrink-0 whitespace-nowrap">
            {isOptimistic ? (
              <PriceLoadingSpinner />
            ) : (
              <Money
                data={{
                  amount: subtotalBeforeDiscounts.toString(),
                  currencyCode,
                }}
              />
            )}
          </span>
        </div>
        {discountTotal > 0 && (
          <div className="flex items-center justify-between">
            <span>{t("cart.discount")}</span>
            <span className="inline-flex shrink-0 items-baseline whitespace-nowrap">
              −
              <Money
                as="span"
                data={{ amount: discountTotal.toString(), currencyCode }}
              />
            </span>
          </div>
        )}
        <span className="text-(--color-text-light)">
          {t("cart.shippingTaxesCalculated")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span>
          {t(
            cart.appliedGiftCards.length ? "cart.remainingToPay" : "cart.total",
          )}
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {isOptimistic ? (
            <PriceLoadingSpinner />
          ) : cart.cost.totalAmount?.amount ? (
            <Money data={cart.cost.totalAmount} />
          ) : (
            "-"
          )}
        </span>
      </div>
      {!isOptimistic && (
        <LoyaltyPointsHint amount={cart.cost.subtotalAmount?.amount} />
      )}
    </>
  );
}

function CartLines({
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

function CartCheckoutActions({
  checkoutUrl,
  layout,
  pending = false,
}: {
  checkoutUrl: string;
  layout: Layouts;
  pending?: boolean;
}) {
  const { t } = useTranslation();
  const { checkoutButtonText } = useTranslatedThemeSettings();
  const cartRoute = usePrefixPathWithLocale("/cart");
  if (!checkoutUrl && !pending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* @todo: <CartShopPayButton cart={cart} /> */}
      {layout === "drawer" && (
        <Link
          variant="outline"
          to={cartRoute}
          onClick={() => toggleCartDrawer(false)}
          className="flex h-[54px] w-full items-center justify-center uppercase"
        >
          {t("cart.viewCart")}
        </Link>
      )}
      <a
        href={pending ? undefined : checkoutUrl}
        aria-disabled={pending}
        target="_self"
      >
        <Button
          disabled={pending}
          className="!px-6 !py-5 h-[54px] w-full uppercase"
        >
          {checkoutButtonText || t("cart.checkout")}
        </Button>
      </a>
    </div>
  );
}

function CartSummary({
  layout,
  className,
  children = null,
}: {
  children?: React.ReactNode;
  className?: string;
  layout: Layouts;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        className,
        layout === "drawer" &&
          "grid max-h-[55dvh] shrink-0 gap-2.5 overflow-y-auto border-line-subtle border-t bg-white py-4 max-xl:gap-3.5 max-xl:pt-2.5 max-xl:pb-0",
        layout === "page" &&
          "flex w-full flex-col gap-6 px-5 pb-6 md:mx-auto md:w-[432px] md:px-0 xl:mx-0 xl:w-full xl:px-6",
      )}
    >
      {layout === "page" && (
        <span className="pb-6 font-medium uppercase">
          {t("cart.orderSummary")}
        </span>
      )}
      {children}
    </div>
  );
}

function CartLineItem({
  line,
  layout,
  discountCodes,
}: {
  line: CartLine;
  layout: Layouts;
  discountCodes: CartApiQueryFragment["discountCodes"];
}) {
  const { t } = useTranslation();
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const { pendingIdentifier } = useCartMutation();

  if (!line?.id) {
    return null;
  }

  const { id, quantity, merchandise, isOptimistic } = line;
  const isLinePending = pendingIdentifier === id;

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
        (isOptimistic || isLinePending) &&
          optimisticData?.action !== "remove" &&
          "opacity-70",
        id.startsWith("optimistic-") && "pointer-events-none",
        optimisticData?.action === "remove" &&
          "h-0 scale-95 overflow-hidden opacity-0",
      )}
    >
      {/* Loading Overlay - Only show for remove action */}
      {isOptimistic && optimisticData?.action === "remove" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <span className="text-gray-600 text-sm">{t("cart.removing")}</span>
          </div>
        </div>
      )}

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
                    isLoading={isOptimistic || isLinePending}
                  />
                </div>
                <CartLineQuantityAdjust line={line} layout={layout} />
                <div className="justify-self-end font-normal">
                  <CartLinePrice
                    line={line}
                    amountType="total"
                    fontWeight="normal"
                    as="span"
                    isLoading={isOptimistic || isLinePending}
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
                  isLoading={isOptimistic || isLinePending}
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

function CartLineOptions({
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

function CartLineDiscountBadges({
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

function ItemRemoveButton({
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

function CartLineQuantityAdjust({
  line,
  layout,
}: {
  line: CartLine;
  layout: Layouts;
}) {
  const { t } = useTranslation();
  let optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const { isPending, submitMutation } = useCartMutation();
  const { id: lineId, isOptimistic } = line || {};
  const quantityId = useId();

  const optimisticQuantity = optimisticData?.quantity ?? line?.quantity ?? 1;
  const quantities = Array.from(
    { length: Math.max(10, optimisticQuantity) },
    (_, index) => index + 1,
  );
  const [selectedQty, setSelectedQty] = useState<number>(optimisticQuantity);

  useEffect(() => {
    setSelectedQty(optimisticQuantity);
  }, [optimisticQuantity]);

  // Early return after hooks
  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  // Ensure the select shows the actual quantity even if it's outside default options
  const optionValues = Array.from(
    new Set<number>([...quantities, optimisticQuantity, selectedQty]),
  ).sort((a, b) => a - b);

  const disabled = lineId.startsWith("optimistic-") || isPending;
  const desktopStepper = (() => {
    if (layout !== "drawer") {
      return null;
    }
    const updateQuantity = (nextQuantity: number) => {
      if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        return;
      }
      submitMutation(
        CartForm.ACTIONS.LinesUpdate,
        { lines: [{ id: lineId, quantity: nextQuantity }] },
        { id: lineId, data: { quantity: nextQuantity } },
      );
    };

    return (
      <fieldset
        className="hidden h-[30px] items-center rounded-lg bg-(--color-background-subtle) xl:inline-flex"
        aria-label={t("product.quantityValue", {
          quantity: optimisticQuantity,
        })}
      >
        <button
          type="button"
          className="flex h-full w-11 items-center justify-center disabled:opacity-40"
          disabled={disabled || optimisticQuantity <= 1}
          aria-label={t("product.decreaseQuantity")}
          onClick={() => updateQuantity(optimisticQuantity - 1)}
        >
          <span
            aria-hidden="true"
            className="font-semibold text-sm leading-none"
          >
            -
          </span>
        </button>
        <span className="flex h-full w-[30px] items-center justify-center border-white/20 border-x font-semibold text-sm">
          {optimisticQuantity}
        </span>
        <button
          type="button"
          className="flex h-full w-11 items-center justify-center disabled:opacity-40"
          disabled={disabled}
          aria-label={t("product.increaseQuantity")}
          onClick={() => updateQuantity(optimisticQuantity + 1)}
        >
          <span
            aria-hidden="true"
            className="font-semibold text-sm leading-none"
          >
            +
          </span>
        </button>
      </fieldset>
    );
  })();

  return (
    <>
      {desktopStepper}
      <label htmlFor={quantityId} className="sr-only">
        {t("product.quantityValue", { quantity: optimisticQuantity })}
      </label>
      <div
        className={clsx(
          "quantity-selector relative",
          layout === "drawer" && "xl:hidden",
        )}
      >
        <Select.Root
          value={String(selectedQty)}
          onValueChange={(value) => {
            const nextQuantity = Number(value);
            if (
              !Number.isInteger(nextQuantity) ||
              nextQuantity < 1 ||
              nextQuantity === optimisticQuantity
            ) {
              return;
            }

            setSelectedQty(nextQuantity);
            submitMutation(
              CartForm.ACTIONS.LinesUpdate,
              { lines: [{ id: lineId, quantity: nextQuantity }] },
              { id: lineId, data: { quantity: nextQuantity } },
            );
          }}
          disabled={disabled}
        >
          <Select.Trigger
            id={quantityId}
            className={clsx(
              "inline-flex min-w-[80px] items-center justify-between gap-2 bg-white outline-hidden",
              layout === "drawer" && "min-h-8 min-w-20 focus-visible:outline-2",
            )}
            aria-label={t("product.selectQuantity")}
          >
            <span
              className={clsx(layout === "page" ? "font-medium text-sm" : "")}
            >
              {t("product.quantityShort")}
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
              <CaretDown className="h-3 w-3" />
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
      </div>
    </>
  );
}

function PriceLoadingSpinner({ className = "" }: { className?: string }) {
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

function CartLinePrice({
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

function CartEmpty({
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
