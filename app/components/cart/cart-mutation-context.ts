import { createContext, useContext } from "react";

type OptimisticData = {
  action?: string;
  quantity?: number;
};

export type CartMutationContextValue = {
  errorMessage: string | null;
  isPending: boolean;
  pendingIdentifier: string | null;
  submitMutation: (
    action: string,
    inputs: Record<string, unknown>,
    optimistic?: { id: string; data: OptimisticData },
  ) => void;
};

export const CartMutationContext =
  createContext<CartMutationContextValue | null>(null);

export function useCartMutation() {
  const context = useContext(CartMutationContext);
  if (!context) {
    throw new Error("useCartMutation must be used within Cart");
  }
  return context;
}
