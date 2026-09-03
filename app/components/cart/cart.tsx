import { CartMain } from "./cart-main";
import type { CartLayout } from "./cart-types";
import { useCart } from "./store";

export function Cart({
  layout,
  onClose,
}: {
  layout: CartLayout;
  onClose?: () => void;
}) {
  const cart = useCart();
  return <CartMain cart={cart} layout={layout} onClose={onClose} />;
}
