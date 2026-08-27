export type WishlistApiResponse = {
  authenticated: boolean;
  productIds: string[];
  error?: string;
  setupRequired?: boolean;
};
