import { createElement } from "react";
import { useLocation, useRouteLoaderData } from "react-router";
import { NavbarCount } from "~/components/layout/navbar-count";
import Link from "~/components/link";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { ThemivoWishlistDialog } from "./themivo-wishlist-dialog";
import { WishlistIcon } from "./wishlist-icon";
import { WISHLIST_POSITION_CLASSES } from "./wishlist-position";
import { useWishlist } from "./wishlist-provider";

export function ThemivoWishlistEntry({
  floating = false,
}: {
  floating?: boolean;
}) {
  const t = useThemivoTranslation();
  const root = useRouteLoaderData<RootLoader>("root");
  const { key } = useLocation();
  const { count, error, themivo } = useWishlist();
  const appearance = root?.themivoAppearance;
  const position = appearance?.launcherPosition;
  if (root?.themivoScriptShop) {
    return floating ? null : createElement("wl-count");
  }
  if (!themivo || (floating && !position)) {
    return null;
  }

  const mode = root?.themivoAppearance?.wishlistMode ?? "page";
  const showCount = !floating && appearance?.showHeaderCount !== false;
  const label = showCount
    ? t(
        count === 1 ? "wishlist.openOne" : "wishlist.open",
        { count },
        "wishlist.open",
      )
    : t("wishlist.title");
  const className = cn(
    "flex items-center justify-center",
    floating && position
      ? [
          "fixed z-40 size-12 rounded-full border border-line-subtle bg-background shadow-md",
          WISHLIST_POSITION_CLASSES[position],
        ]
      : "relative h-5 gap-0",
  );
  const icon = (
    <>
      <WishlistIcon className="size-5 shrink-0" fallback="bookmark" />
      {showCount && <NavbarCount count={count} />}
    </>
  );

  return (
    <>
      {mode === "page" ? (
        <Link to="/wishlist" aria-label={label} className={className}>
          {icon}
        </Link>
      ) : (
        <ThemivoWishlistDialog
          key={key}
          mode={mode}
          label={label}
          triggerClassName={className}
        >
          {icon}
        </ThemivoWishlistDialog>
      )}
      {!floating && (
        <span role="status" className="sr-only">
          {error ? t(error) : ""}
        </span>
      )}
    </>
  );
}
