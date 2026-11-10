export type WishlistApiResponse = {
  acceptsGuests?: boolean;
  themivo?: boolean;
  hiddenProductIds?: string[];
  loginRequired?: boolean;
  authenticated: boolean;
  savedProductCount?: number;
  savedVariantIds?: string[];
  productIds: string[];
  error?: string;
  setupRequired?: boolean;
};

export type ThemivoItem = {
  listId: string;
  productId: string;
  variantId: string;
  quantity?: number;
  addedAt?: number;
};

export type ThemivoList = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount?: number;
  kind?: "wishlist" | "saved_for_later";
  shared: boolean;
  role: "owner" | "editor" | "viewer";
};

export const THEMIVO_CART_TRANSFER_ATTRIBUTE = "_aspen_wishlist_transfer";
