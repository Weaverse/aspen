import { CartForm } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { useId, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { CART_CODE_APPLY_ACTION, uppercaseCartCode } from "~/utils/cart-code";
import { getCartMutationError } from "~/utils/cart-error";
import { useCartFetcherSync } from "./cart-sync";
import type { CartMutationResponse } from "./cart-types";

export function CartCodeForm({
  allowDiscountCode,
  allowGiftCard,
  pending = false,
}: {
  allowDiscountCode: boolean;
  allowGiftCard: boolean;
  pending?: boolean;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<
    CartMutationResponse & {
      codeType?: "gift-card" | "discount";
      codeApplied?: boolean;
    }
  >();
  useCartFetcherSync(fetcher);
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [requestPending, setRequestPending] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const submitting = useRef(false);
  const busy = requestPending || fetcher.state !== "idle";
  const disabled = pending || busy;
  const label = t(
    allowDiscountCode && allowGiftCard
      ? "cart.code"
      : allowGiftCard
        ? "cart.giftCardCode"
        : "cart.discountCode",
  );
  const mutationError = getCartMutationError(fetcher.data, t);
  const success = Boolean(
    !disabled &&
      !requestFailed &&
      submittedCode &&
      fetcher.data?.cart &&
      !mutationError &&
      (fetcher.data.codeType === "gift-card"
        ? fetcher.data.codeApplied === true
        : fetcher.data.cart.discountCodes.some(
            (discount) =>
              discount.applicable &&
              discount.code.toLowerCase() === submittedCode.toLowerCase(),
          )),
  );
  const showError =
    !disabled && submittedCode && !success && (fetcher.data || requestFailed);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (disabled || submitting.current || !trimmedCode) {
      return;
    }
    submitting.current = true;
    setRequestPending(true);
    setRequestFailed(false);
    setSubmittedCode(trimmedCode);
    try {
      await fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CART_CODE_APPLY_ACTION,
            inputs: { code: trimmedCode, allowDiscountCode, allowGiftCard },
          }),
        },
        { method: "POST", action: cartRoute },
      );
    } catch {
      setRequestFailed(true);
    } finally {
      submitting.current = false;
      setRequestPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-2">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="flex min-w-0 items-stretch gap-3">
        <input
          id={inputId}
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder={label}
          value={code}
          onChange={(event) => {
            setCode(uppercaseCartCode(event.target.value));
            setSubmittedCode("");
          }}
          disabled={disabled}
          className="h-13.5 min-w-0 flex-1 rounded-(--radius-sm) border border-line bg-background px-4 font-body font-normal text-body text-sm leading-(--body-base-line-height) tracking-(--body-base-spacing) placeholder:text-(--color-text-light) focus-visible:border-body focus-visible:shadow-none focus-visible:outline-none disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="outline"
          aria-label={t("cart.apply")}
          loading={busy}
          disabled={disabled || !code.trim()}
          className="h-13.5 shrink-0 rounded-(--radius-sm) bg-transparent px-6 py-0"
        >
          {t("cart.apply")}
        </Button>
      </div>
      {success && (
        <p role="status" className="text-sm">
          {t(
            fetcher.data?.codeType === "gift-card"
              ? "cart.giftCardApplied"
              : "cart.discountApplied",
          )}
        </p>
      )}
      {showError && (
        <p role="alert" className="text-red-700 text-sm">
          {requestFailed
            ? t("errors.generic")
            : mutationError === "cart.invalidCode"
              ? t("cart.invalidCode")
              : mutationError || t("cart.invalidCode")}
        </p>
      )}
    </form>
  );
}
