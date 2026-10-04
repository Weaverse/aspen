import type { CSSProperties } from "react";

export const DEFAULT_COLLECTION_CARD_OVERLAY_COLOR = "#000000";
export const DEFAULT_COLLECTION_CARD_OVERLAY_OPACITY = 50;

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
}: CollectionCardOverlayProps) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[var(--collection-overlay-opacity)]"
      style={
        {
          "--collection-overlay-opacity": opacity / 100,
          backgroundColor: color,
        } as CSSProperties
      }
    />
  );
}
