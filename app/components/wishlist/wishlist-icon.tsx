import { BookmarkSimpleIcon, HeartIcon, StarIcon } from "@phosphor-icons/react";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";

export function WishlistIcon({
  className,
  saved,
  fallback = "heart",
  useThemivoAppearance = true,
}: {
  className: string;
  saved?: boolean;
  fallback?: "heart" | "bookmark";
  useThemivoAppearance?: boolean;
}) {
  const root = useRouteLoaderData<RootLoader>("root");
  const appearance = useThemivoAppearance ? root?.themivoAppearance : null;
  if (appearance?.customIcon) {
    return (
      // biome-ignore lint/performance/noImgElement: A data SVG is already local and must stay in an image context.
      <img
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
        className={className}
        src={appearance.customIcon}
      />
    );
  }

  const name =
    appearance?.icon === "custom" ? fallback : (appearance?.icon ?? fallback);
  const Icon =
    name === "star"
      ? StarIcon
      : name === "bookmark"
        ? BookmarkSimpleIcon
        : HeartIcon;
  return (
    <Icon
      aria-hidden="true"
      className={className}
      weight={saved ? "fill" : "regular"}
    />
  );
}
