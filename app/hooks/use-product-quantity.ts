import { useEffect, useState } from "react";
import { canAddCartLines, useCartStore } from "~/components/cart/store";
import { useVariantInventoryPolicy } from "~/components/cart/use-cart-inventory-policy";

type QuantityVariant =
  import("~/graphql/storefront-types").ProductVariantFragment;

export function useProductQuantity(
  variant?: QuantityVariant | null,
  sellingPlanId?: string | null,
) {
  const [requestedQuantity, setQuantity] = useState(1);
  const stock = variant?.quantityAvailable;
  const needsPolicy =
    Boolean(variant?.availableForSale) &&
    typeof stock === "number" &&
    stock < 10;
  const { policy, pending } = useVariantInventoryPolicy(
    variant?.id,
    needsPolicy,
  );
  // Unknown policy must retain Shopify validation rather than disable backorders.
  const inventoryLimit =
    typeof stock === "number" && (policy === "DENY" || pending)
      ? Math.max(1, Math.min(10, stock))
      : 10;
  const soldOut =
    !variant?.availableForSale ||
    (typeof stock === "number" && stock <= 0 && policy === "DENY");
  const maxQuantity = useCartStore((state) => {
    if (!variant || soldOut || pending) {
      return 0;
    }
    // Reuse cart reservations and per-line limits, including selling plans.
    for (let count = inventoryLimit; count >= 1; count -= 1) {
      if (
        canAddCartLines(state, [
          {
            merchandiseId: variant.id,
            selectedVariant: variant,
            sellingPlanId: sellingPlanId ?? undefined,
            quantity: count,
          },
        ])
      ) {
        return count;
      }
    }
    return 0;
  });
  const canPurchase = maxQuantity > 0;
  const quantity = canPurchase
    ? Math.min(Math.max(1, requestedQuantity), maxQuantity)
    : 0;

  useEffect(() => {
    if (!pending) {
      setQuantity((current) =>
        canPurchase ? Math.min(Math.max(1, current), maxQuantity) : 0,
      );
    }
  }, [maxQuantity, pending, canPurchase]);

  return { quantity, setQuantity, maxQuantity, canPurchase, soldOut };
}
