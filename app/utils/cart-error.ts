import type { TranslateFunction } from "@weaverse/hydrogen";

export const CART_ERROR_KEYS = {
  noLineSelected: "cart.errors.noLineSelected",
  selectAvailableOption: "cart.errors.selectAvailableOption",
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
    case CART_ERROR_KEYS.selectAvailableOption:
      return t("cart.errors.selectAvailableOption");
    default:
      return message ?? null;
  }
}
