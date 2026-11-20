import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import { createElement } from "react";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { translateError } from "~/utils/translated-error";
import { themivoButtonAppearance } from "./themivo-button-appearance";
import { WishlistIcon } from "./wishlist-icon";
import { WISHLIST_POSITION_CLASSES } from "./wishlist-position";
import { useWishlist } from "./wishlist-provider";

export function ProductCardWishlistButton({
  productId,
  variantId,
  productTitle,
  className,
}: {
  productId: string;
  variantId?: string;
  productTitle: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const root = useRouteLoaderData<RootLoader>("root");
  const { pcardEnableWishlist = true, pcardWishlistAppearance = "aspen" } =
    useThemeSettings();
  const useThemivoAppearance =
    pcardWishlistAppearance === "themivo" || Boolean(root?.themivoScriptShop);
  const appearance = useThemivoAppearance ? root?.themivoAppearance : null;
  const enabled =
    appearance?.cardEnabled ??
    (pcardEnableWishlist || Boolean(root?.themivoScriptShop));
  const {
    error,
    isHidden,
    isLoading,
    isUpdating,
    isWishlisted,
    setupRequired,
    themivo,
    toggle,
  } = useWishlist();
  const savedVariant =
    themivo && root?.themivoAppearance?.productPerVariant
      ? variantId
      : undefined;
  const saved = isWishlisted(productId, savedVariant);
  const updating = isUpdating(productId, savedVariant);
  const label = t(saved ? "wishlist.remove" : "wishlist.add", {
    product: productTitle,
  });
  const numericId = /^gid:\/\/shopify\/Product\/(\d+)$/.exec(productId)?.[1];

  if (!enabled || !numericId) {
    return null;
  }

  const position =
    WISHLIST_POSITION_CLASSES[appearance?.cardPosition ?? "top-right"];
  if (root?.themivoScriptShop) {
    return (
      <span
        className={cn(
          "absolute z-20 flex",
          position,
          appearance?.cardShowOnHover &&
            "transition-opacity [@media(hover:hover)]:opacity-0 group-hover/wishlist-host:opacity-100 group-focus-within/wishlist-host:opacity-100 has-[wl-card-button[active]]:opacity-100",
        )}
      >
        {createElement("wl-card-button", { "product-id": numericId })}
      </span>
    );
  }

  if (isHidden(productId)) {
    return null;
  }

  return (
    <button
      type="button"
      aria-busy={updating}
      aria-label={label}
      aria-pressed={saved}
      className={cn(
        "absolute z-20 flex size-9 items-center justify-center rounded-full text-body transition-[color,opacity,transform] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body disabled:cursor-wait disabled:opacity-50",
        position,
        appearance?.cardShowOnHover &&
          !saved &&
          "[@media(hover:hover)]:opacity-0 group-hover/wishlist-host:opacity-100 focus-visible:opacity-100",
        !appearance && className,
      )}
      style={themivoButtonAppearance(appearance, { iconOnly: true })}
      disabled={isLoading || updating}
      onClick={() => toggle(productId, savedVariant)}
      title={
        setupRequired
          ? t("wishlist.setupRequired")
          : error
            ? translateError(t, error)
            : label
      }
    >
      <WishlistIcon
        className="size-5"
        saved={saved}
        useThemivoAppearance={useThemivoAppearance}
      />
    </button>
  );
}
