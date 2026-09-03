import { Tag, X } from "@phosphor-icons/react";
import { CartForm, Money } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { type Fetcher, useFetcher } from "react-router";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { getCartMutationError } from "~/utils/cart-error";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CART_CODE_APPLY_ACTION } from "./cart-actions";
import { PriceLoadingSpinner } from "./cart-line-item";
import { useCartFetcherSync } from "./cart-sync";
import type {
  CartLayout,
  CartMutationResponse,
  CartWithOptimistic,
} from "./cart-types";

export function CartProgression({
  cost,
}: {
  cost: CartWithOptimistic["cost"];
}) {
  const { t } = useTranslation();
  const { freeShippingThreshold } = useThemeSettings();
  const subtotal = Number.parseFloat(cost?.subtotalAmount?.amount || "0");
  const configuredThreshold = Number.parseFloat(freeShippingThreshold || "100");
  const threshold =
    Number.isFinite(configuredThreshold) && configuredThreshold > 0
      ? configuredThreshold
      : 100;
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const amountRemaining = Math.max(threshold - subtotal, 0);
  const amountToken = "__CART_AMOUNT__";
  const [prefix, suffix] = t("cart.freeShippingRemaining", {
    amount: amountToken,
  }).split(amountToken);

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
            {prefix}
            <b>
              <Money
                withoutTrailingZeros
                data={{
                  amount: amountRemaining.toString(),
                  currencyCode: cost.subtotalAmount.currencyCode,
                }}
              />
            </b>
            {suffix}
          </>
        ) : (
          t("cart.freeShippingUnlocked")
        )}
      </p>
    </div>
  );
}

export function CartDiscounts({
  discountCodes,
  appliedGiftCards,
}: {
  discountCodes: CartWithOptimistic["discountCodes"];
  appliedGiftCards: CartWithOptimistic["appliedGiftCards"];
}) {
  return (
    <div className="space-y-3">
      <CartCodeForm />
      <AppliedCartCodes
        appliedGiftCards={appliedGiftCards}
        discountCodes={discountCodes}
        layout="page"
      />
    </div>
  );
}

function CartCodeForm() {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<
    CartMutationResponse & { cartCodeApplied?: boolean }
  >({ key: "cart-code-apply" });
  const errorMessage =
    getCartMutationError(fetcher.data, t) ||
    (fetcher.data?.cartCodeApplied === false ? t("cart.invalidCode") : null);
  useCartFetcherSync(fetcher);

  return (
    <fetcher.Form method="post" action={cartRoute}>
      <input
        type="hidden"
        name={CartForm.INPUT_NAME}
        value={JSON.stringify({ action: CART_CODE_APPLY_ACTION, inputs: {} })}
      />
      <div className="flex items-stretch gap-3">
        <label htmlFor="cart-page-discount" className="sr-only">
          {t("cart.code")}
        </label>
        <input
          id="cart-page-discount"
          className="h-[54px] min-w-0 grow border border-line bg-white px-4 leading-tight! outline-none focus:border-gray-700"
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
          className="!px-6 !py-0 h-[54px] shrink-0 leading-tight!"
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

function SyncedCartForm({
  action,
  inputs,
  children,
}: {
  action:
    | typeof CartForm.ACTIONS.DiscountCodesUpdate
    | typeof CartForm.ACTIONS.GiftCardCodesRemove;
  inputs: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  return (
    <CartForm route={cartRoute} action={action} inputs={inputs as any}>
      {(fetcher) => (
        <SyncedCartFormContent fetcher={fetcher}>
          {children}
        </SyncedCartFormContent>
      )}
    </CartForm>
  );
}

function SyncedCartFormContent({
  fetcher,
  children,
}: {
  fetcher: Fetcher<unknown>;
  children: React.ReactNode;
}) {
  useCartFetcherSync(fetcher);
  return <>{children}</>;
}

export function AppliedCartCodes({
  discountCodes,
  appliedGiftCards,
  layout,
}: {
  discountCodes: CartWithOptimistic["discountCodes"];
  appliedGiftCards: CartWithOptimistic["appliedGiftCards"];
  layout: CartLayout;
}) {
  const { t } = useTranslation();
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
          <SyncedCartForm
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
                aria-label={t("cart.removeDiscountCode", {
                  code: discount.code,
                })}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </SyncedCartForm>
        </li>
      ))}
      {appliedGiftCards.map((giftCard) => (
        <li key={giftCard.id}>
          <SyncedCartForm
            action={CartForm.ACTIONS.GiftCardCodesRemove}
            inputs={{ appliedGiftCardIds: [giftCard.id] }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-sm bg-[#EBE8E5] px-2 py-1 text-[#574F49] text-xs">
              <Tag size={13} aria-hidden="true" />
              <span>•••• {giftCard.lastCharacters}</span>
              <button
                type="submit"
                className="flex h-4 w-4 items-center justify-center"
                aria-label={t("cart.removeGiftCard", {
                  digits: giftCard.lastCharacters,
                })}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </SyncedCartForm>
        </li>
      ))}
    </ul>
  );
}

function getCartDiscountTotal(lines: CartWithOptimistic["lines"]["nodes"]) {
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

export function CartPageTotals({ cart }: { cart: CartWithOptimistic }) {
  const { t } = useTranslation();
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
          <span>{t("cart.subtotal")}</span>
          <span>
            {cart.isOptimistic ? (
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
            <span>
              -
              <Money
                data={{ amount: discountTotal.toString(), currencyCode }}
              />
            </span>
          </div>
        )}
        <span className="text-[#918379]">
          {t("cart.shippingTaxesCalculated")}
        </span>
      </div>
      <div className="flex items-center justify-between font-semibold">
        <span>{t("cart.total")}</span>
        <span>
          {cart.isOptimistic ? (
            <PriceLoadingSpinner />
          ) : cart.cost.totalAmount?.amount ? (
            <Money data={cart.cost.totalAmount} />
          ) : (
            "-"
          )}
        </span>
      </div>
      <LoyaltyPointsHint amount={cart.cost.subtotalAmount?.amount} />
    </>
  );
}

export function CartCheckoutActions({
  checkoutUrl,
  layout,
}: {
  checkoutUrl: string;
  layout: CartLayout;
}) {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  if (!checkoutUrl) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3">
      {layout === "drawer" && (
        <Link
          variant="outline"
          to={cartRoute}
          onClick={() => toggleCartDrawer(false)}
          className="flex h-[54px] w-full items-center justify-center"
        >
          {t("cart.viewCart")}
        </Link>
      )}
      <a href={checkoutUrl} target="_self">
        <Button className="!px-6 !py-5 h-[54px] w-full">
          {t("cart.checkout")}
        </Button>
      </a>
    </div>
  );
}

export function CartSummary({
  layout,
  children,
}: {
  children?: React.ReactNode;
  layout: CartLayout;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        layout === "drawer" &&
          "grid gap-3 border-line-subtle border-t bg-white py-4",
        layout === "page" &&
          "flex w-full flex-col gap-6 px-5 pb-6 md:w-[432px] md:px-0 lg:w-full lg:px-6",
      )}
    >
      {layout === "page" && (
        <span className="border-line-subtle border-b pb-6 font-semibold uppercase">
          {t("cart.orderSummary")}
        </span>
      )}
      {children}
    </div>
  );
}
