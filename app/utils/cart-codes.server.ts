import { mergeDiscountCodes } from "./cart-code.ts";
import { normalizeGiftCardCode } from "./gift-card.ts";

type DiscountCodeCart<Result> = {
  get(): Promise<{
    discountCodes?: Array<{ code: string }>;
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

  return cart.updateDiscountCodes(mergeDiscountCodes(existingCodes, code));
}

export function addGiftCardCodes<Result>(
  cart: GiftCardCart<Result>,
  codes: string[],
) {
  return cart.addGiftCardCodes(codes.map(normalizeGiftCardCode));
}
