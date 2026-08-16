import { CaretDown, Tag, X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  CartForm,
  Money,
  type OptimisticCart,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Form, useFetcher } from "react-router";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { CART_CODE_APPLY_ACTION } from "~/components/cart/cart-actions";
import { syncCartState } from "~/components/cart/cart-state-provider";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { SubscriptionLineItem } from "~/components/subscriptions/subscription-line-item";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
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
  cart: originalCart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartApiQueryFragment;
}) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  const mutationFetcher = useFetcher<CartMutationResponse>({
    key: `cart-${layout}-line-mutation`,
  });
  const handledMutationResponse = useRef<unknown>(null);
  const mutationInFlight = useRef(false);
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(
    null,
  );
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = Boolean(cart) && cart.totalQuantity > 0;
  const errorMessage =
    mutationFetcher.data?.userErrors?.find((error) => error.message)?.message ||
    mutationFetcher.data?.errors?.find((error) => error.message)?.message ||
    null;

  useEffect(() => {
    const response = mutationFetcher.data;
    if (mutationFetcher.state !== "idle") {
      return;
    }

    mutationInFlight.current = false;
    setPendingIdentifier(null);
    if (!response || handledMutationResponse.current === response) {
      return;
    }

    handledMutationResponse.current = response;
    if (
      response.cart &&
      !response.userErrors?.length &&
      !response.errors?.length
    ) {
      syncCartState(response.cart);
    }
  }, [mutationFetcher.data, mutationFetcher.state]);

  const submitMutation = useCallback(
    (
      action: string,
      inputs: Record<string, unknown>,
      optimistic?: { id: string; data: OptimisticData },
    ) => {
      if (mutationInFlight.current) {
        return;
      }

      mutationInFlight.current = true;
      const formData = new FormData();
      formData.set(CartForm.INPUT_NAME, JSON.stringify({ action, inputs }));
      if (optimistic) {
        formData.set("optimistic-identifier", optimistic.id);
        formData.set("optimistic-data", JSON.stringify(optimistic.data));
      }

      setPendingIdentifier(optimistic?.id ?? null);
      mutationFetcher.submit(formData, {
        action: cartRoute,
        method: "post",
      });
    },
    [cartRoute, mutationFetcher],
  );

  const mutationContext: CartMutationContextValue = {
    errorMessage,
    isPending: mutationFetcher.state !== "idle" || pendingIdentifier !== null,
    pendingIdentifier,
    submitMutation,
  };

  return (
    <CartMutationContext.Provider value={mutationContext}>
      {cartHasItems ? (
        <CartDetails cart={cart} layout={layout} />
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
            "rounded-md px-3 py-2 text-sm",
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
            "rounded-md px-3 py-2 text-sm",
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
            "rounded-md px-3 py-2 text-sm",
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
  const { errorMessage } = useCartMutation();

  const mutationError = errorMessage ? (
    <p className="bg-red-50 p-3 text-red-700 text-sm" role="alert">
      {errorMessage}
    </p>
  ) : null;

  const summaryActions = (enableCartNote ||
    enableDiscountCode ||
    enableGiftCard) && (
    <div className="flex flex-wrap items-center gap-2">
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
      <div className="flex min-h-0 flex-1 flex-col">
        {enableFreeShipping && <CartProgression cost={cart.cost} />}
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] px-5">
          <div className="overflow-y-auto pr-2 pb-5">
            {mutationError}
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
              <span>Subtotal</span>
              <span>
                {isOptimistic ? (
                  <PriceLoadingSpinner />
                ) : cart.cost?.subtotalAmount?.amount ? (
                  <Money data={cart.cost.subtotalAmount} />
                ) : (
                  "-"
                )}
              </span>
            </div>
            <p className="text-[#918379] text-sm">
              Shipping and taxes will be calculated at checkout
            </p>
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
      {mutationError}
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
          <CartPageTotals cart={cart} isOptimistic={isOptimistic} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
      </div>
    </div>
  );
}

function CartProgression({ cost }: { cost: CartApiQueryFragment["cost"] }) {
  let { freeShippingThreshold } = useThemeSettings();

  let subtotal = Number.parseFloat(cost?.subtotalAmount?.amount || "0");
  const configuredThreshold = Number.parseFloat(freeShippingThreshold || "100");
  let threshold =
    Number.isFinite(configuredThreshold) && configuredThreshold > 0
      ? configuredThreshold
      : 100;
  let progress = Math.min((subtotal / threshold) * 100, 100);
  let amountRemaining = Math.max(threshold - subtotal, 0);
  return (
    <div className="flex w-full flex-col gap-2 px-5 pb-2">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#F2F0EE]">
        <div
          className="h-full bg-[#A79D95] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm">
        {amountRemaining > 0 ? (
          <>
            You’re{" "}
            <b>
              <Money
                withoutTrailingZeros
                data={{
                  amount: amountRemaining.toString(),
                  currencyCode: cost.subtotalAmount.currencyCode,
                }}
              />
            </b>{" "}
            away from free shipping!
          </>
        ) : (
          "You’ve unlocked free shipping!"
        )}
      </p>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
  appliedGiftCards,
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];

  return (
    <div className="space-y-3">
      <CartCodeForm discountCodes={codes} />
      <AppliedCartCodes
        appliedGiftCards={appliedGiftCards}
        discountCodes={discountCodes}
        layout="page"
      />
    </div>
  );
}

function CartCodeForm({ discountCodes }: { discountCodes: string[] }) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<{
    cartCodeApplied?: boolean;
    errors?: Array<{ message?: string }>;
    userErrors?: Array<{ message?: string }>;
  }>({ key: "cart-code-apply" });
  const errorMessage =
    fetcher.data?.userErrors?.find((error) => error.message)?.message ||
    fetcher.data?.errors?.find((error) => error.message)?.message ||
    (fetcher.data?.cartCodeApplied === false
      ? "Invalid gift card or discount code."
      : null);

  return (
    <fetcher.Form method="post" action={cartRoute}>
      <input
        type="hidden"
        name={CartForm.INPUT_NAME}
        value={JSON.stringify({
          action: CART_CODE_APPLY_ACTION,
          inputs: { discountCodes },
        })}
      />
      <div className="flex items-stretch gap-3">
        <label htmlFor="cart-page-discount" className="sr-only">
          Gift card or discount code
        </label>
        <input
          id="cart-page-discount"
          className="h-[54px] min-w-0 grow border border-line bg-white px-4 leading-tight! outline-none focus:border-gray-700"
          type="text"
          name="discountCode"
          placeholder="Gift card or discount code"
          required
        />
        <Button
          variant="outline"
          type="submit"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
          className="!px-6 !py-0 h-[54px] shrink-0 leading-tight!"
        >
          Apply
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
  discountCodes,
  appliedGiftCards,
  layout,
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
  layout: Layouts;
}) {
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
      aria-label="Applied codes"
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
            <div className="inline-flex items-center gap-1.5 rounded-sm bg-[#EBE8E5] px-2 py-1 text-[#574F49] text-xs">
              <Tag size={13} aria-hidden="true" />
              <span>{discount.code}</span>
              <button
                type="submit"
                className="flex h-4 w-4 items-center justify-center"
                aria-label={`Remove discount code ${discount.code}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </CartForm>
        </li>
      ))}
      {appliedGiftCards.map((giftCard) => (
        <li key={giftCard.id}>
          <Form action={cartRoute} method="post">
            <input
              type="hidden"
              name={CartForm.INPUT_NAME}
              value={JSON.stringify({
                action: CartForm.ACTIONS.GiftCardCodesRemove,
                inputs: { appliedGiftCardIds: [giftCard.id] },
              })}
            />
            <div className="inline-flex items-center gap-1.5 rounded-sm bg-[#EBE8E5] px-2 py-1 text-[#574F49] text-xs">
              <Tag size={13} aria-hidden="true" />
              <span>•••• {giftCard.lastCharacters}</span>
              <button
                type="submit"
                className="flex h-4 w-4 items-center justify-center"
                aria-label={`Remove gift card ending in ${giftCard.lastCharacters}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </Form>
        </li>
      ))}
    </ul>
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
  const discountTotal = getCartDiscountTotal(cart.lines.nodes);
  const currencyCode = cart.cost.subtotalAmount.currencyCode;
  const subtotalAfterDiscounts = Number.parseFloat(
    cart.cost.subtotalAmount.amount,
  );
  const subtotalBeforeDiscounts = subtotalAfterDiscounts + discountTotal;

  return (
    <>
      <div className="flex flex-col gap-5 border-line-subtle border-y py-6">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>
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
            <span>Discount</span>
            <span>
              -
              <Money
                data={{ amount: discountTotal.toString(), currencyCode }}
              />
            </span>
          </div>
        )}
        <span className="text-[#918379]">
          Shipping &amp; taxes calculated at checkout
        </span>
      </div>
      <div className="flex items-center justify-between font-semibold">
        <span>Total</span>
        <span>
          {isOptimistic ? (
            <PriceLoadingSpinner />
          ) : cart.cost.totalAmount?.amount ? (
            <Money data={cart.cost.totalAmount} />
          ) : (
            "-"
          )}
        </span>
      </div>
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
          layout === "drawer" && "grid gap-5",
        )}
      >
        {currentLines.map((line) => (
          <CartLineItem
            key={line.id}
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
}: {
  checkoutUrl: string;
  layout: Layouts;
}) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  if (!checkoutUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* @todo: <CartShopPayButton cart={cart} /> */}
      {layout === "drawer" && (
        <Link
          variant="outline"
          to={cartRoute}
          onClick={() => toggleCartDrawer(false)}
          className="flex h-[54px] w-full items-center justify-center"
        >
          VIEW CART
        </Link>
      )}
      <a href={checkoutUrl} target="_self">
        <Button className="!px-6 !py-5 h-[54px] w-full">CHECKOUT</Button>
      </a>
    </div>
  );
}

function CartSummary({
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  layout: Layouts;
}) {
  return (
    <div
      className={clsx(
        layout === "drawer" &&
          "grid gap-3 border-line-subtle border-t bg-white py-4",
        layout === "page" &&
          "flex w-full flex-col gap-6 px-5 pb-6 md:mx-auto md:w-1/2 md:px-0 lg:mx-0 lg:w-full lg:px-6",
      )}
    >
      {layout === "page" && (
        <span className="border-line-subtle border-b pb-6 font-semibold uppercase">
          Order summary
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
          : "flex h-full flex-col items-center bg-white md:flex-row",
        (isOptimistic || isLinePending) &&
          optimisticData?.action !== "remove" &&
          "opacity-70",
        (isOptimistic || isLinePending) && "pointer-events-none",
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
                  productTitle={product?.title || title}
                  className="h-4 w-4"
                  layout={layout}
                />
              </div>

              {/* Variant Information */}
              <CartLineOptions selectedOptions={selectedOptions} />
            </div>

            <div className="space-y-3">
              {/* Subscription and discount information sit directly above pricing. */}
              <SubscriptionLineItem line={line as any} />
              <CartLineDiscountBadges
                discountCodes={discountCodes}
                line={line}
              />

              {/* Quantity and Pricing */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div>
                  Item price:{" "}
                  <CartLinePrice
                    line={line}
                    amountType="unit"
                    as="span"
                    isLoading={isOptimistic || isLinePending}
                  />
                </div>
                <CartLineQuantityAdjust line={line} layout={layout} />
                <div className="justify-self-end font-medium">
                  <CartLinePrice
                    line={line}
                    amountType="total"
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
                <CartLineOptions selectedOptions={selectedOptions} />
                {/* Subscription Information */}
                <SubscriptionLineItem line={line as any} className="mt-2" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <CartLineQuantityAdjust line={line} layout={layout} />
              <CartLinePrice
                line={line}
                amountType="total"
                as="span"
                isLoading={isOptimistic || isLinePending}
              />
            </div>
            <ItemRemoveButton
              lineId={id}
              productTitle={product?.title || title}
              className=""
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
  discountCodes: CartApiQueryFragment["discountCodes"];
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
}: {
  lineId: CartLine["id"];
  productTitle: string;
  className?: string;
  layout: Layouts;
}) {
  const { isPending, submitMutation } = useCartMutation();

  return (
    <button
      className={clsx("flex items-center justify-center", className)}
      type="button"
      disabled={isPending}
      aria-label={`Remove ${productTitle} from cart`}
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
        <span className="uppercase underline">Remove</span>
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

  return (
    <>
      <label htmlFor={quantityId} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div className="quantity-selector relative">
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
          disabled={isOptimistic || isPending}
        >
          <Select.Trigger
            id={quantityId}
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
          "h-full min-h-0 w-full content-start space-y-12 overflow-y-auto px-5 pb-5 transition",
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
            heading="Shop Best Sellers"
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      )}
    </div>
  );
}
