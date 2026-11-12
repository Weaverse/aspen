import { ShopPayButton as HydrogenShopPayButton } from "@shopify/hydrogen/react";

/** Keep Aspen's buy-box sizing while using the new same-origin Shop Pay link. */
export function ShopPayButton({
  width = "100%",
  variantIdsAndQuantities,
}: {
  width?: string;
  storeDomain?: string;
  variantIdsAndQuantities: Array<{
    id: string;
    quantity: number;
    sellingPlanId?: string;
  }>;
}) {
  return (
    <div style={{ width, minHeight: "var(--shop-pay-button-height)" }}>
      <HydrogenShopPayButton
        width="100%"
        variants={variantIdsAndQuantities.map(
          ({ id, quantity, sellingPlanId }) => ({
            id,
            quantity,
            sellingPlanId,
          }),
        )}
      />
    </div>
  );
}
