import { HeartIcon } from "@phosphor-icons/react";
import { useWishlist } from "./wishlist-provider";

export function ProductCardWishlistButton({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
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
      className="absolute top-4 right-4 z-20 hidden size-9 items-center justify-center rounded-full text-body transition-[color,opacity,transform] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body disabled:cursor-wait disabled:opacity-50 lg:flex"
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
        className="size-5"
        weight={saved ? "fill" : "regular"}
      />
    </button>
  );
}
