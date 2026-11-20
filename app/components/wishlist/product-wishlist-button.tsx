import { createElement, useEffect } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { translateError } from "~/utils/translated-error";
import { themivoButtonAppearance } from "./themivo-button-appearance";
import { WishlistIcon } from "./wishlist-icon";
import { useWishlist } from "./wishlist-provider";

export function ProductWishlistButton({
  productId,
  variantId,
  productTitle,
  useAspenAppearance = false,
  onImage: imagePlacement,
  compact = false,
  className,
}: {
  productId: string;
  variantId?: string;
  productTitle: string;
  useAspenAppearance?: boolean;
  onImage?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const t = useThemivoTranslation();
  const preview = useRouteLoaderData<RootLoader>("root");
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
  const appearance = preview?.themivoAppearance;
  const onImage = imagePlacement ?? appearance?.productPlacement === "image";
  const display =
    onImage || compact ? "icon" : (appearance?.productDisplay ?? "icon");
  const fullWidth = !onImage && appearance?.productFullWidth;
  const savedVariant =
    themivo && appearance?.productPerVariant ? variantId : undefined;
  const saved = isWishlisted(productId, savedVariant);
  const updating = isUpdating(productId, savedVariant);
  const hidden = isHidden(productId);
  const countEnabled =
    themivo &&
    !preview?.themivoScriptShop &&
    appearance?.productShowCount === true &&
    !onImage &&
    !compact &&
    !hidden &&
    !isLoading;
  const countPath = usePrefixPathWithLocale("/api/wishlist");
  const { data: countData, load: loadCount } = useFetcher<{
    productId: string;
    count: number | null;
  }>();
  useEffect(() => {
    if (countEnabled && !updating) {
      loadCount(`${countPath}?countProduct=${encodeURIComponent(productId)}`);
    }
  }, [countEnabled, countPath, loadCount, productId, updating]);
  const count =
    countEnabled && countData?.productId === productId ? countData.count : null;
  const label = t(saved ? "wishlist.remove" : "wishlist.add", {
    product: productTitle,
  });

  const numericId = /^gid:\/\/shopify\/Product\/(\d+)$/.exec(productId)?.[1];
  if (preview?.themivoScriptShop && numericId) {
    const numericVariantId = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(
      variantId ?? "",
    )?.[1];
    return createElement("wl-button", {
      "product-id": numericId,
      "variant-id": numericVariantId,
      "data-wl-image": onImage ? "" : undefined,
      className,
    });
  }

  if (hidden) {
    return null;
  }

  return (
    <button
      type="button"
      aria-busy={updating}
      aria-label={
        count === null
          ? label
          : `${label}. ${t("wishlist.productCount", { count })}`
      }
      aria-pressed={saved}
      className={cn(
        "inline-flex size-[54px] shrink-0 items-center justify-center rounded-lg border border-line-subtle bg-background text-body transition-[background-color,border-color,color,opacity,transform]",
        "hover:border-line hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
        "disabled:cursor-wait disabled:opacity-50",
        saved && "border-line",
        useAspenAppearance && "size-9 rounded-full border-0 bg-transparent",
        (display !== "icon" || count !== null) &&
          "min-w-fit gap-2 px-3 whitespace-nowrap",
        fullWidth && "w-full",
        className,
      )}
      style={themivoButtonAppearance(useAspenAppearance ? null : appearance, {
        iconOnly: display === "icon" && count === null,
        fullWidth,
      })}
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
      {display !== "text" && (
        <WishlistIcon
          className={cn(
            useAspenAppearance ? "size-5" : "size-6",
            updating && "animate-pulse",
          )}
          saved={saved}
          useThemivoAppearance={!useAspenAppearance}
        />
      )}
      {display !== "icon" &&
        t(saved ? "wishlist.removeShort" : "wishlist.addShort")}
      {count !== null && <span className="text-xs">{count}</span>}
    </button>
  );
}
