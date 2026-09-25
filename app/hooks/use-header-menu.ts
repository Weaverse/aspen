import type { SingleMenuItem } from "~/types/menu";
import { useShopMenu } from "./use-shop-menu";

// Desktop and Compact render the same navigation content with different layouts.
export function useHeaderMenu() {
  const { headerMenu } = useShopMenu();
  return (headerMenu?.items ?? []) as unknown as SingleMenuItem[];
}
