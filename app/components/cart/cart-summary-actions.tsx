import { XIcon } from "@phosphor-icons/react";
import { CartForm } from "@shopify/hydrogen";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { AnimatedBottomSheet } from "./animate-bottom-sheet";

export function NoteDialog({
  cartNote: currentNote,
  open,
  onClose,
}: {
  cartNote: string;
  open: boolean;
  onClose: () => void;
}) {
  const [note, setNote] = useState(currentNote);
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setSubmitted(true);
    }
  }, [fetcher]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formCartNote = formData.get("cartNote") as string;
    if (formCartNote) {
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.NoteUpdate,
            inputs: { cartNote: formCartNote },
          }),
        },
        { method: "POST", action: "/cart" },
      );
      setNote(formCartNote);
    }
  }

  return (
    <AnimatedBottomSheet open={open}>
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label="Close"
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <h2 className="mb-6 font-semibold text-xl">Add a note</h2>

      <form className="space-y-1" onSubmit={handleSubmit}>
        <textarea
          className="min-h-32 w-full resize-none border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
          placeholder="Add any special instructions or notes for your order..."
          rows={4}
          name="cartNote"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSubmitted(false);
          }}
        />
        {submitted && (
          <p className="bg-green-50 p-3 text-green-700">
            Cart note saved successfully 🎉
          </p>
        )}
        <Button
          type="submit"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
          className="w-full leading-tight! [--spinner-duration:400ms]"
        >
          Add note
        </Button>
      </form>
    </AnimatedBottomSheet>
  );
}

export function DiscountDialog({
  discountCodes = [],
  open,
  onClose,
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const fetcher = useFetcher();
  const submitted = Boolean(code && fetcher.state === "idle" && fetcher.data);
  const success = Boolean(
    submitted && discountCodes?.find((d) => d.code === code && d.applicable),
  );
  const error = submitted && !success;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const discountCode = formData.get("discountCode") as string;
    if (discountCode) {
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
        { method: "POST", action: "/cart" },
      );
    }
  }

  return (
    <AnimatedBottomSheet open={open}>
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label="Close"
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <h2 className="mb-6 font-semibold text-xl">Apply a discount code</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            fetcher.data = null;
          }}
          className="w-full border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
          type="text"
          name="discountCode"
          placeholder="Discount code"
          required
        />
        {success && (
          <p className="bg-green-50 p-3 text-green-700">
            Discount applied successfully 🎉
          </p>
        )}
        {error && (
          <p className="bg-red-50 p-3 text-red-700">Invalid discount code.</p>
        )}
        <Button
          type="submit"
          className="w-full leading-tight! [--spinner-duration:400ms]"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
        >
          Apply
        </Button>
      </form>
    </AnimatedBottomSheet>
  );
}

export function GiftCardDialog({
  appliedGiftCards = [],
  open,
  onClose,
}: {
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
  open: boolean;
  onClose: () => void;
}) {
  const appliedGiftCardCodes = useRef<string[]>([]);
  const [code, setCode] = useState("");
  const fetcher = useFetcher();
  const submitted = Boolean(code && fetcher.state === "idle" && fetcher.data);
  const success = Boolean(
    submitted &&
      appliedGiftCards?.find((gc) =>
        code.toLowerCase().endsWith(gc.lastCharacters),
      ),
  );
  const error = submitted && !success;

  function saveAppliedCode(gcCode: string) {
    const formattedCode = gcCode.replace(/\s/g, ""); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const giftCardCode = formData.get("giftCardCode") as string;
    if (giftCardCode) {
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.GiftCardCodesUpdate,
            inputs: {
              giftCardCode,
              giftCardCodes: appliedGiftCardCodes.current,
            },
          }),
        },
        { method: "POST", action: "/cart" },
      );
      saveAppliedCode(giftCardCode);
    }
  }

  return (
    <AnimatedBottomSheet open={open}>
      <button
        type="button"
        className="absolute top-4 right-4 z-10 flex items-center justify-center"
        aria-label="Close"
        onClick={onClose}
      >
        <XIcon size={16} />
      </button>

      <h2 className="mb-6 font-semibold text-xl">Redeem a gift card</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border border-line p-3 text-[#918379] focus:border-gray-500 focus:outline-none"
          type="text"
          name="giftCardCode"
          placeholder="Gift card code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            fetcher.data = null;
          }}
          required
        />
        {success && (
          <p className="bg-green-50 p-3 text-green-700">
            Gift card applied successfully 🎉
          </p>
        )}
        {error && (
          <p className="bg-red-50 p-3 text-red-700">Invalid gift card code.</p>
        )}
        <Button
          type="submit"
          className="w-full leading-tight! [--spinner-duration:400ms]"
          loading={fetcher.state !== "idle"}
          disabled={fetcher.state !== "idle"}
        >
          Apply
        </Button>
      </form>
    </AnimatedBottomSheet>
  );
}
