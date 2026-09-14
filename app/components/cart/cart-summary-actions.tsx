import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { getCartMutationError } from "~/utils/cart-error";
import { isGiftCardApplied, normalizeGiftCardCode } from "~/utils/gift-card";
import { AnimatedBottomSheet } from "./animate-bottom-sheet";
import { useCartFetcherSync } from "./cart-sync";

type DialogLayout = "page" | "drawer";

type CartMutationResponse = {
  cart?: CartApiQueryFragment | null;
  errors?: Array<{ message?: string }>;
  userErrors?: Array<{ message?: string }>;
};

function CenteredModal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <Dialog.Overlay forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[calc(100%-40px)] max-w-[430px]"
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-h-[calc(100dvh-40px)] w-full overflow-y-auto rounded-xl bg-white px-5 py-4 shadow-2xl"
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Portal>
  );
}

function CartActionDialogHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-2 flex min-h-5 items-center justify-between gap-4">
      <Dialog.Title className="font-semibold text-sm uppercase leading-5 tracking-[0.02em]">
        {title}
      </Dialog.Title>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("cart.close")}
        className="relative flex size-5 shrink-0 items-center justify-center rounded-sm before:absolute before:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <XIcon size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export function NoteDialog({
  cartNote: currentNote,
  open,
  onClose,
  layout = "drawer",
}: {
  cartNote: string;
  open: boolean;
  onClose: () => void;
  layout?: DialogLayout;
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState(currentNote);
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher<CartMutationResponse>();
  useCartFetcherSync(fetcher);
  const cartRoute = usePrefixPathWithLocale("/cart");
  const mutationError = getCartMutationError(fetcher.data, t);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !mutationError) {
      setSubmitted(true);
    }
  }, [fetcher.data, fetcher.state, mutationError]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fetcher.state !== "idle") {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const formCartNote = formData.get("cartNote") as string;
    fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.NoteUpdate,
          inputs: { note: formCartNote },
        }),
      },
      { method: "POST", action: cartRoute },
    );
    setNote(formCartNote);
  }

  const content = (
    <>
      <CartActionDialogHeader title={t("cart.noteTitle")} onClose={onClose} />

      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <label htmlFor="cart-note" className="sr-only">
          {t("cart.orderNote")}
        </label>
        <textarea
          id="cart-note"
          className="block h-[120px] min-h-[120px] w-full resize-none rounded-lg border border-[#CCC] bg-white p-4 text-[#343231] text-sm leading-5 placeholder:text-[#979797] focus:border-gray-500 focus:outline-none"
          placeholder={t("cart.notePlaceholder")}
          rows={4}
          name="cartNote"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSubmitted(false);
          }}
        />
        {submitted && (
          <p className="bg-green-50 p-3 text-green-700" aria-live="polite">
            {t("cart.noteSaved")}
          </p>
        )}
        {mutationError && (
          <p className="bg-red-50 p-3 text-red-700" role="alert">
            {mutationError}
          </p>
        )}
        <Button
          type="submit"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
          className="h-[54px] w-full shrink-0 rounded-lg py-0! text-sm leading-5! [--spinner-duration:400ms]"
        >
          {t("cart.addNote")}
        </Button>
      </form>
    </>
  );

  return layout === "page" ? (
    <CenteredModal open={open}>{content}</CenteredModal>
  ) : (
    <AnimatedBottomSheet open={open}>{content}</AnimatedBottomSheet>
  );
}

export function DiscountDialog({
  discountCodes = [],
  open,
  onClose,
  layout = "drawer",
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  open: boolean;
  onClose: () => void;
  layout?: DialogLayout;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const fetcher = useFetcher<CartMutationResponse>();
  useCartFetcherSync(fetcher);
  const cartRoute = usePrefixPathWithLocale("/cart");
  const submitted = Boolean(
    submittedCode && fetcher.state === "idle" && fetcher.data,
  );
  const success = Boolean(
    submitted &&
      fetcher.data?.cart?.discountCodes?.find(
        (discount) =>
          discount.code.toLowerCase() === submittedCode.toLowerCase() &&
          discount.applicable,
      ),
  );
  const mutationError = getCartMutationError(fetcher.data, t);
  const error = submitted && !success;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fetcher.state !== "idle") {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const discountCode = formData.get("discountCode") as string;
    if (discountCode) {
      setSubmittedCode(discountCode.trim());
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.DiscountCodesUpdate,
            inputs: {
              discountCode,
              discountCodes: discountCodes.map((d) => d.code),
            },
          }),
        },
        { method: "POST", action: cartRoute },
      );
    }
  }

  const content = (
    <>
      <CartActionDialogHeader
        title={t("cart.discountTitle")}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="cart-discount-code" className="sr-only">
          {t("cart.discountCode")}
        </label>
        <input
          id="cart-discount-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-[54px] w-full rounded-lg border border-[#CCC] bg-white px-4 text-[#343231] text-sm leading-5 placeholder:text-[#979797] focus:border-gray-500 focus:outline-none"
          type="text"
          name="discountCode"
          placeholder={t("cart.discountCode")}
          required
        />
        {success && (
          <p className="bg-green-50 p-3 text-green-700">
            {t("cart.discountApplied")}
          </p>
        )}
        {error && (
          <p className="bg-red-50 p-3 text-red-700" role="alert">
            {mutationError || t("cart.invalidDiscount")}
          </p>
        )}
        <Button
          type="submit"
          className="h-[54px] w-full shrink-0 rounded-lg py-0! text-sm leading-5! [--spinner-duration:400ms]"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
        >
          {t("cart.apply")}
        </Button>
      </form>
    </>
  );

  return layout === "page" ? (
    <CenteredModal open={open}>{content}</CenteredModal>
  ) : (
    <AnimatedBottomSheet open={open}>{content}</AnimatedBottomSheet>
  );
}

export function GiftCardDialog({
  open,
  onClose,
  layout = "drawer",
}: {
  open: boolean;
  onClose: () => void;
  layout?: DialogLayout;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  useEffect(() => {
    if (!open) {
      setSubmittedCode("");
    }
  }, [open]);
  const fetcher = useFetcher<CartMutationResponse>();
  useCartFetcherSync(fetcher);
  const cartRoute = usePrefixPathWithLocale("/cart");
  const submitted = Boolean(
    submittedCode && fetcher.state === "idle" && fetcher.data,
  );
  const success = Boolean(
    submitted && isGiftCardApplied(fetcher.data, submittedCode),
  );
  const mutationError = getCartMutationError(fetcher.data, t);
  const error = submitted && !success;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fetcher.state !== "idle") {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const giftCardCode = formData.get("giftCardCode") as string;
    if (giftCardCode) {
      const formattedCode = normalizeGiftCardCode(giftCardCode);
      setSubmittedCode(formattedCode);
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.GiftCardCodesAdd,
            inputs: {
              giftCardCodes: [formattedCode],
            },
          }),
        },
        { method: "POST", action: cartRoute },
      );
    }
  }

  const content = (
    <>
      <CartActionDialogHeader
        title={t("cart.giftCardTitle")}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="cart-gift-card-code" className="sr-only">
          {t("cart.giftCardCode")}
        </label>
        <input
          id="cart-gift-card-code"
          className="h-[54px] w-full rounded-lg border border-[#CCC] bg-white px-4 text-[#343231] text-sm leading-5 placeholder:text-[#979797] focus:border-gray-500 focus:outline-none"
          type="text"
          name="giftCardCode"
          placeholder={t("cart.giftCardTitle")}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setSubmittedCode("");
          }}
          required
        />
        {success && (
          <p className="bg-green-50 p-3 text-green-700">
            {t("cart.giftCardApplied")}
          </p>
        )}
        {error && (
          <p className="bg-red-50 p-3 text-red-700" role="alert">
            {mutationError || t("cart.invalidGiftCard")}
          </p>
        )}
        <Button
          type="submit"
          className="h-[54px] w-full shrink-0 rounded-lg py-0! text-sm leading-5! [--spinner-duration:400ms]"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
        >
          {t("cart.apply")}
        </Button>
      </form>
    </>
  );

  return layout === "page" ? (
    <CenteredModal open={open}>{content}</CenteredModal>
  ) : (
    <AnimatedBottomSheet open={open}>{content}</AnimatedBottomSheet>
  );
}
