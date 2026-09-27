import { HeartIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";
import { translateError } from "~/utils/translated-error";
import { useWishlist } from "./wishlist-provider";

export function ProductCardWishlistButton({
  productId,
  productTitle,
  showOnTablet = false,
  showOnMobile = false,
}: {
  productId: string;
  productTitle: string;
  showOnTablet?: boolean;
  showOnMobile?: boolean;
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
      className={cn(
        "absolute top-4 right-4 z-20 size-9 items-center justify-center rounded-full text-body transition-[color,opacity,transform] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body disabled:cursor-wait disabled:opacity-50",
        showOnMobile
          ? "flex"
          : showOnTablet
            ? "hidden md:flex"
            : "hidden lg:flex",
      )}
      disabled={isLoading || updating}
      onClick={() => toggle(productId)}
      title={
        setupRequired
          ? t("wishlist.setupRequired")
          : error
            ? translateError(t, error)
            : label
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
