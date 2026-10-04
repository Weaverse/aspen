import type { CSSProperties } from "react";

export const DEFAULT_COLLECTION_CARD_OVERLAY_COLOR = "#000000";
export const DEFAULT_COLLECTION_CARD_OVERLAY_OPACITY = 50;
export const DEFAULT_SHOWCASE_MOBILE_EFFECT_COLOR = "#CABDB7";
export const DEFAULT_SHOWCASE_MOBILE_EFFECT_OPACITY = 90;

interface CollectionCardOverlayProps {
  color: string;
  opacity: number;
}

export function CollectionCardOverlay({
  color,
  opacity,
}: CollectionCardOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[var(--collection-overlay-opacity)]"
      style={
        {
          "--collection-overlay-opacity": opacity / 100,
          backgroundColor: color,
        } as CSSProperties
      }
    />
  );
}

export function CollectionNameBackground({
  color,
  opacity,
  mobileColor = DEFAULT_SHOWCASE_MOBILE_EFFECT_COLOR,
  mobileOpacity = DEFAULT_SHOWCASE_MOBILE_EFFECT_OPACITY,
}: CollectionCardOverlayProps & {
  mobileColor?: string;
  mobileOpacity?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[var(--collection-mobile-effect-color)] opacity-[var(--collection-mobile-effect-opacity)] lg:bg-[var(--collection-desktop-effect-color)] lg:opacity-[var(--collection-desktop-effect-opacity)]"
      style={
        {
          "--collection-mobile-effect-color": mobileColor,
          "--collection-mobile-effect-opacity": mobileOpacity / 100,
          "--collection-desktop-effect-color": color,
          "--collection-desktop-effect-opacity": opacity / 100,
        } as CSSProperties
      }
    />
  );
}
