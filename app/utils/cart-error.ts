import type { TranslateFunction } from "@weaverse/hydrogen";

export const CART_ERROR_KEYS = {
  noLineSelected: "cart.errors.noLineSelected",
  removeLine: "cart.errors.removeLine",
  selectAvailableOption: "cart.errors.selectAvailableOption",
  updateQuantity: "cart.errors.updateQuantity",
} as const;

type CartError = { message?: string };

export function getCartMutationError(
  data:
    | {
        errors?: CartError[];
        userErrors?: CartError[];
      }
    | null
    | undefined,
  t: TranslateFunction,
) {
  const message =
    data?.userErrors?.find((error) => error.message)?.message ??
    data?.errors?.find((error) => error.message)?.message;

  switch (message) {
    case CART_ERROR_KEYS.noLineSelected:
      return t("cart.errors.noLineSelected");
    case CART_ERROR_KEYS.removeLine:
      return t("cart.errors.removeLine");
    case CART_ERROR_KEYS.selectAvailableOption:
      return t("cart.errors.selectAvailableOption");
    case CART_ERROR_KEYS.updateQuantity:
      return t("cart.errors.updateQuantity");
    default:
      return message ?? null;
  }
}
