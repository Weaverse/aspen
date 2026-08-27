import { HeartIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
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
      className={clsx(
        "inline-flex size-[54px] shrink-0 items-center justify-center rounded-lg border border-line-subtle bg-background text-body transition-[background-color,border-color,color,opacity,transform]",
        "hover:border-line hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body",
        "disabled:cursor-wait disabled:opacity-50",
        saved && "border-line",
        className,
      )}
      disabled={isLoading || updating}
      onClick={() => toggle(productId)}
      title={setupRequired ? t("wishlist.setupRequired") : error || label}
    >
      <HeartIcon
        aria-hidden="true"
        className={clsx("size-6", updating && "animate-pulse")}
        weight={saved ? "fill" : "regular"}
      />
    </button>
  );
}
