import { CartForm, Image } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useId, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { getCartMutationError } from "~/utils/cart-error";
import { CART_ACTION_DESKTOP_HOVER } from "./cart-action-styles";
import { useCartFetcherSync } from "./cart-sync";
import type { CartMutationResponse } from "./cart-types";

/** Keep the fetcher mounted even if the buyer dismisses a pending note. */
export function CartPageNote({
  note,
  enabled = true,
}: {
  note: string;
  enabled?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const route = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher<CartMutationResponse>();
  useCartFetcherSync(fetcher);
  const busy = fetcher.state !== "idle";
  const error = getCartMutationError(fetcher.data, t);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(note);
  const [draft, setDraft] = useState(note);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => setSaved(note), [note]);
  useEffect(() => {
    if (!busy && fetcher.data?.cart && !error) {
      const accepted = fetcher.data.cart.note ?? "";
      setSaved(accepted);
      setDraft(accepted);
    }
  }, [busy, fetcher.data, error]);

  function changeOpen(next: boolean) {
    setDraft(saved);
    setSubmitted(false);
    setOpen(next);
  }

  const form = (
    <fetcher.Form
      method="post"
      action={route}
      className="flex flex-col gap-2.5 p-4"
      onSubmit={() => setSubmitted(true)}
    >
      <input
        type="hidden"
        name={CartForm.INPUT_NAME}
        value={JSON.stringify({
          action: CartForm.ACTIONS.NoteUpdate,
          inputs: { note: draft },
        })}
      />
      <label htmlFor={id} className="sr-only">
        {t("cart.orderNote")}
      </label>
      <textarea
        id={id}
        name="cartNote"
        value={draft}
        disabled={busy}
        onChange={(event) => {
          setDraft(event.target.value);
          setSubmitted(false);
        }}
        placeholder={t("cart.notePlaceholder")}
        className="h-30 w-full resize-none rounded-(--radius-sm) border border-line bg-background p-4 font-body text-sm leading-(--body-base-line-height) tracking-(--body-base-spacing) placeholder:text-(--color-text-light) focus:border-line focus:shadow-none focus:outline-none focus-visible:border-line focus-visible:shadow-none focus-visible:outline-none"
      />
      {submitted &&
        !busy &&
        fetcher.data &&
        (error ? (
          <p role="alert" className="text-red-700 text-sm">
            {error}
          </p>
        ) : (
          <p role="status" className="sr-only">
            {t("cart.noteSaved")}
          </p>
        ))}
      <Button
        type="submit"
        disabled={busy}
        loading={busy}
        className={`min-h-13.5 self-start whitespace-normal [overflow-wrap:anywhere] ${CART_ACTION_DESKTOP_HOVER}`}
      >
        {t("cart.apply")}
      </Button>
    </fetcher.Form>
  );

  return enabled ? (
    <div className="flex flex-col gap-2.5 overflow-hidden rounded-(--radius-md) bg-(--color-cart-note-bg)">
      <button
        type="button"
        id={`${id}-inline-title`}
        aria-expanded={open}
        aria-controls={`${id}-inline-panel`}
        onClick={() => changeOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-body font-semibold text-body text-sm leading-(--body-base-line-height) tracking-[0.02em] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      >
        <Image
          src="/assets/cart/order-note.svg"
          alt=""
          width={16}
          height={16}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 capitalize">{t("cart.orderNote")}</span>
        <Image
          src="/assets/cart/caret-right.svg"
          alt=""
          width={16}
          height={16}
          className={`shrink-0 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <section
          id={`${id}-inline-panel`}
          aria-labelledby={`${id}-inline-title`}
        >
          {form}
        </section>
      )}
    </div>
  ) : null;
}
