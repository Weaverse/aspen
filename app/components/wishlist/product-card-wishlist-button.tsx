import { HeartIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { useWishlist } from "./wishlist-provider";

export function ProductCardWishlistButton({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const { t } = useTranslation();
  const { error, isLoading, isUpdating, isWishlisted, setupRequired, toggle } =
    useWishlist();
  const saved = isWishlisted(productId);
  const updating = isUpdating(productId);
  const label = t(saved ? "wishlist.remove" : "wishlist.add", {
    product: productTitle,
  });

  return (
    <button
      type="button"
      aria-busy={updating}
      aria-label={label}
      aria-pressed={saved}
      className="absolute top-4 right-4 z-20 hidden size-9 items-center justify-center rounded-full text-body transition-[color,opacity,transform] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body disabled:cursor-wait disabled:opacity-50 lg:flex"
      disabled={isLoading || updating}
      onClick={() => toggle(productId)}
      title={setupRequired ? t("wishlist.setupRequired") : error || label}
    >
      <HeartIcon
        aria-hidden="true"
        className="size-5"
        weight={saved ? "fill" : "regular"}
      />
    </button>
  );
}
