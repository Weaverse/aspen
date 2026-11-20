import { useThemeSettings } from "@weaverse/hydrogen";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { WISHLIST_POSITION_CLASSES } from "./wishlist-position";

export function useProductWishlist(
  showAspenWishlist?: boolean,
  fallbackPlacement: "image" | "form" = "form",
) {
  const root = useRouteLoaderData<RootLoader>("root");
  const appearance = root?.themivoAppearance;
  const { pcardEnableWishlist = true, pcardWishlistAppearance = "aspen" } =
    useThemeSettings();
  const useAspenImageAppearance =
    pcardWishlistAppearance !== "themivo" && !root?.themivoScriptShop;
  const showWishlist =
    appearance?.productEnabled ??
    ((showAspenWishlist ?? pcardEnableWishlist) ||
      Boolean(root?.themivoScriptShop));
  const wishlistOnImage =
    showWishlist &&
    (appearance?.productPlacement ?? fallbackPlacement) === "image";
  const wishlistBelowCart =
    showWishlist && appearance?.productPlacement === "form";

  return {
    showWishlist,
    wishlistOnImage,
    wishlistBelowCart,
    useAspenImageAppearance,
    imagePosition:
      WISHLIST_POSITION_CLASSES[
        useAspenImageAppearance
          ? "top-right"
          : (appearance?.productPosition ?? "top-right")
      ],
    formClassName: wishlistBelowCart
      ? "col-span-full md:basis-full empty:hidden"
      : "col-start-2 row-start-2 empty:hidden",
  };
}
