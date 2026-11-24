import { useThemeSettings } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";

export const CONTENT_ALIGNMENT_CLASSES = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

export const CARD_BASE =
  "group/product-card @container/product-card overflow-hidden bg-(--pcard-background) transition-colors duration-300";
export const CARD_HOVER =
  "desktop:px-0 desktop:pt-0 desktop:gap-0 desktop:hover:bg-(--pcard-hover-background) desktop:focus-within:bg-(--pcard-hover-background)";
export const CARD_IMAGE_FRAME =
  "absolute inset-0 transition-[inset] duration-300";
export const CARD_IMAGE_HOVER =
  "desktop:group-hover/product-card:inset-(--pcard-hover-padding) desktop:group-focus-within/product-card:inset-(--pcard-hover-padding)";
export const CARD_IMAGE_ZOOM =
  "desktop:group-hover/product-card:[&>img]:scale-(--pcard-hover-zoom) desktop:group-focus-within/product-card:[&>img]:scale-(--pcard-hover-zoom)";
export const CARD_CONTENT =
  "flex flex-col gap-(--pcard-content-gap) pt-(--pcard-image-content-gap) pb-0";
export const CARD_CONTENT_HOVER =
  "desktop:px-0 transition-[padding] duration-300 desktop:group-hover/product-card:px-5 desktop:group-focus-within/product-card:px-5 desktop:group-hover/product-card:pt-(--pcard-hover-info-top) desktop:group-hover/product-card:pb-(--pcard-hover-info-bottom) desktop:group-focus-within/product-card:pt-(--pcard-hover-info-top) desktop:group-focus-within/product-card:pb-(--pcard-hover-info-bottom)";
export const CARD_TITLE =
  "line-clamp-2 font-body font-normal text-(--color-text) text-sm uppercase text-(length:--pcard-font-size) leading-none tracking-[0.02em]";

export function useProductCardAppearance(imageRatio: string | undefined) {
  const {
    pcardBackgroundColor,
    pcardHoverPadding = 20,
    pcardImageZoom = true,
    pcardHoverZoom = 105,
    pcardFontSize = 14,
    pcardContentGap = 12,
    pcardImageContentGap = 20,
  } = useThemeSettings();
  const hoverZoom = Number(pcardHoverZoom);
  return {
    pcardImageZoom,
    cardStyle: {
      "--pcard-background": pcardBackgroundColor || "transparent",
      "--pcard-hover-background": "var(--pcard-hover-background-default)",
      "--pcard-hover-padding": `${pcardHoverPadding}px`,
      "--pcard-hover-zoom": Number.isFinite(hoverZoom)
        ? Math.min(150, Math.max(100, hoverZoom)) / 100
        : 1.05,
      "--pcard-font-size": `${pcardFontSize}px`,
      "--pcard-content-gap": `${pcardContentGap}px`,
      "--pcard-image-content-gap": `${pcardImageContentGap}px`,
      // Transfer image spacing below the info so hover cannot resize the card.
      "--pcard-hover-info-top":
        "max(0px, calc(var(--pcard-image-content-gap) - var(--pcard-hover-padding)))",
      "--pcard-hover-info-bottom":
        "min(var(--pcard-image-content-gap), var(--pcard-hover-padding))",
      "--pcard-radius": "var(--pcard-border-radius-default)",
      "--pcard-image-ratio": imageRatio,
      borderRadius: "var(--pcard-radius)",
    } as CSSProperties,
  };
}
