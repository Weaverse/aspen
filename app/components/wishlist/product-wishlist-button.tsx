import { HeartIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useWishlist } from "./wishlist-provider";

export function ProductWishlistButton({
  productId,
  productTitle,
  className,
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const { error, isLoading, isUpdating, isWishlisted, setupRequired, toggle } =
    useWishlist();
  const saved = isWishlisted(productId);
  const updating = isUpdating(productId);
  const action = saved ? "Remove" : "Add";

  return (
    <button
      type="button"
      aria-busy={updating}
      aria-label={`${action} ${productTitle} ${saved ? "from" : "to"} wishlist`}
      aria-pressed={saved}
      className={clsx(
        "inline-flex size-[54px] shrink-0 items-center justify-center rounded-lg border border-line-subtle bg-background text-body transition-[background-color,border-color,color,opacity,transform]",
        "hover:border-line hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
        "disabled:cursor-wait disabled:opacity-50",
        saved && "border-line",
        className,
      )}
      disabled={isLoading || updating}
      onClick={() => toggle(productId)}
      title={
        setupRequired
          ? "Wishlist needs to be enabled in Shopify customer metafields."
          : error ||
            `${action} ${productTitle} ${saved ? "from" : "to"} wishlist`
      }
    >
      <HeartIcon
        aria-hidden="true"
        className={clsx("size-6", updating && "animate-pulse")}
        weight={saved ? "fill" : "regular"}
      />
    </button>
  );
}
