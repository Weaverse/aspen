import { mergeDiscountCodes, uppercaseCartCode } from "./cart-code.ts";
import { normalizeGiftCardCode } from "./gift-card.ts";

type DiscountCodeCart<Result> = {
  get(): Promise<{
    discountCodes?: Array<{ code: string }>;
    appliedGiftCards?: Array<{ id: string }>;
  } | null>;
  updateDiscountCodes(codes: string[]): Promise<Result>;
};

type GiftCardCart<Result> = {
  addGiftCardCodes(codes: string[]): Promise<Result>;
};

export async function updateDiscountCodes<Result>(
  cart: DiscountCodeCart<Result>,
  code: string,
) {
  const existingCodes =
    (await cart.get())?.discountCodes?.map((discount) => discount.code) ?? [];

  return cart.updateDiscountCodes(
    mergeDiscountCodes(existingCodes, uppercaseCartCode(code)),
  );
}

export function addGiftCardCodes<Result>(
  cart: GiftCardCart<Result>,
  codes: string[],
) {
  return cart.addGiftCardCodes(codes.map(normalizeGiftCardCode));
}

function hasCartApiErrors(result: { errors?: unknown }) {
  return Array.isArray(result.errors)
    ? result.errors.length > 0
    : Boolean(result.errors);
}

function hasCartCodeErrors(result: {
  errors?: unknown;
  userErrors?: unknown[];
}) {
  return hasCartApiErrors(result) || Boolean(result.userErrors?.length);
}

// Try gift cards first and remove unaccepted discount probes. A no-op gift
// mutation (including reapplying a card) must not persist its full code.
export async function applyCartCode<
  Result extends {
    errors?: unknown;
    userErrors?: unknown[];
    cart?: {
      discountCodes?: Array<{ code: string; applicable: boolean }>;
      appliedGiftCards?: Array<{ id: string }>;
    } | null;
  },
>(
  cart: DiscountCodeCart<Result> & GiftCardCart<Result>,
  code: string,
  options: { allowDiscountCode: boolean; allowGiftCard: boolean },
): Promise<
  Result & { codeType: "gift-card" | "discount"; codeApplied: boolean }
> {
  let previousDiscountCodes: Array<{ code: string }> = [];
  if (options.allowGiftCard) {
    const previousCart = await cart.get();
    previousDiscountCodes = previousCart?.discountCodes ?? [];
    const previousGiftCards = previousCart?.appliedGiftCards ?? [];
    const previousIds = new Set(previousGiftCards.map((card) => card.id));
    const result = await addGiftCardCodes(cart, [code]);
    const codeApplied = Boolean(
      !hasCartCodeErrors(result) &&
        result.cart?.appliedGiftCards?.some(
          (card) => !previousIds.has(card.id),
        ),
    );
    if (codeApplied || hasCartApiErrors(result) || !options.allowDiscountCode) {
      return { ...result, codeType: "gift-card", codeApplied };
    }
  }
  if (!options.allowDiscountCode) {
    throw new Error("No cart code type is enabled");
  }
  const result = await updateDiscountCodes(cart, code);
  const codeApplied = Boolean(
    !hasCartCodeErrors(result) &&
      result.cart?.discountCodes?.some(
        (discount) =>
          discount.applicable &&
          discount.code.toLowerCase() === code.toLowerCase(),
      ),
  );
  const isNewProbe = !previousDiscountCodes.some(
    (discount) => discount.code.toLowerCase() === code.toLowerCase(),
  );
  if (
    options.allowGiftCard &&
    !hasCartCodeErrors(result) &&
    !codeApplied &&
    isNewProbe &&
    result.cart?.discountCodes?.some(
      (discount) => discount.code.toLowerCase() === code.toLowerCase(),
    )
  ) {
    const remainingCodes = result.cart.discountCodes
      .filter((discount) => discount.code.toLowerCase() !== code.toLowerCase())
      .map((discount) => discount.code);
    return {
      ...(await cart.updateDiscountCodes(remainingCodes)),
      codeType: "discount",
      codeApplied: false,
    };
  }
  return {
    ...result,
    codeType: "discount",
    codeApplied,
  };
}
