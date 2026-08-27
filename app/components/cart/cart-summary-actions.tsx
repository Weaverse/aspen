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
import { AnimatedBottomSheet } from "./animate-bottom-sheet";

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
              className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[calc(100%-40px)] max-w-md"
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-lg bg-white px-6 py-6 shadow-2xl"
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
  const cartRoute = usePrefixPathWithLocale("/cart");
  const mutationError = getCartMutationError(fetcher.data, t);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !mutationError) {
      setSubmitted(true);
    }
  }, [fetcher.data, fetcher.state, mutationError]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label={t("cart.close")}
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <Dialog.Title asChild>
        <h2 className="mb-6 font-semibold text-xl">{t("cart.noteTitle")}</h2>
      </Dialog.Title>

      <form className="space-y-1" onSubmit={handleSubmit}>
        <label htmlFor="cart-note" className="sr-only">
          {t("cart.orderNote")}
        </label>
        <textarea
          id="cart-note"
          className="min-h-32 w-full resize-none border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
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
          className="w-full leading-tight! [--spinner-duration:400ms]"
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
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label={t("cart.close")}
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <Dialog.Title asChild>
        <h2 className="mb-6 font-semibold text-xl">
          {t("cart.discountTitle")}
        </h2>
      </Dialog.Title>

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="cart-discount-code" className="sr-only">
          {t("cart.discountCode")}
        </label>
        <input
          id="cart-discount-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
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
          className="w-full leading-tight! [--spinner-duration:400ms]"
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
  const fetcher = useFetcher<CartMutationResponse>();
  const cartRoute = usePrefixPathWithLocale("/cart");
  const submitted = Boolean(
    submittedCode && fetcher.state === "idle" && fetcher.data,
  );
  const success = Boolean(
    submitted &&
      fetcher.data?.cart?.appliedGiftCards?.find((giftCard) =>
        submittedCode
          .toLowerCase()
          .endsWith(giftCard.lastCharacters.toLowerCase()),
      ),
  );
  const mutationError = getCartMutationError(fetcher.data, t);
  const error = submitted && !success;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const giftCardCode = formData.get("giftCardCode") as string;
    if (giftCardCode) {
      const formattedCode = giftCardCode.replace(/\s/g, "");
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
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label={t("cart.close")}
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <Dialog.Title asChild>
        <h2 className="mb-6 font-semibold text-xl">
          {t("cart.giftCardTitle")}
        </h2>
      </Dialog.Title>

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="cart-gift-card-code" className="sr-only">
          {t("cart.giftCardCode")}
        </label>
        <input
          id="cart-gift-card-code"
          className="w-full border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
          type="text"
          name="giftCardCode"
          placeholder={t("cart.giftCardCode")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
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
          className="w-full leading-tight! [--spinner-duration:400ms]"
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
