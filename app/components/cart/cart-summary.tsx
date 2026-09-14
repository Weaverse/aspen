import { Tag, Truck, X } from "@phosphor-icons/react";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { CART_CODE_APPLY_ACTION } from "~/components/cart/cart-actions";
import { Link } from "~/components/link";
import { LoyaltyPointsHint } from "~/components/loyalty/loyalty-points-hint";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { getCartMutationError } from "~/utils/cart-error";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { PriceLoadingSpinner } from "./cart-line-item";
import { CartResponseSync, useCartFetcherSync } from "./cart-sync";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";
const cartCodeBadgeClassName =
  "flex items-center gap-2 bg-[var(--background-subtle-2-ui,#DFDFDF)] px-2 py-1 font-['DM_Sans'] text-[12px] font-normal not-italic leading-none tracking-[0.24px] text-[color:var(--Text-Subtle,#524B46)]";

type CartMutationResponse = {
  cart?: CartApiQueryFragment | null;
  errors?: Array<{ message?: string }>;
  userErrors?: Array<{ message?: string }>;
};

export function CartProgression({
  cost,
}: {
  cost: CartApiQueryFragment["cost"];
}) {
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

export function CartDiscounts({
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

export function getCartCodeDiscountAmounts(lines: CartLine[]) {
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

export function CartCodeForm() {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<{
    cartCodeApplied?: boolean;
    errors?: Array<{ message?: string }>;
    userErrors?: Array<{ message?: string }>;
  }>({ key: "cart-code-apply" });
  useCartFetcherSync(fetcher);
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

export function UpdateDiscountForm({
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

export function AppliedCartCodes({
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

export function GiftCardRemoveForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: (pending: boolean) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<CartMutationResponse>();
  useCartFetcherSync(fetcher);
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

export function getCartDiscountTotal(
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

export function CartPageTotals({
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

export function CartCheckoutActions({
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

export function CartSummary({
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
