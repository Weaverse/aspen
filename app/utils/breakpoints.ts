/**
 * Theme viewport scale. Tablet extends through 1032px.
 *
 * Mobile:  < 768
 * Tablet:  768–1032
 * Desktop: 1033+
 *
 * CSS mirrors this via `--breakpoint-md` (768) and `--breakpoint-lg` / `--breakpoint-desktop` (1033).
 */
export const MOBILE_MAX_PX = 767;
export const TABLET_MIN_PX = 768;
export const TABLET_MAX_PX = 1032;
export const DESKTOP_MIN_PX = TABLET_MAX_PX + 1;

// Mirrors `--breakpoint-md: 48em` (768px at the default root font size), so JS
// and CSS can never disagree at fractional viewport widths.
export const MEDIA_MOBILE = `(width < 48em)`;
export const MEDIA_FROM_TABLET = `(min-width: ${TABLET_MIN_PX}px)`;
export const MEDIA_UNTIL_DESKTOP = `(width < ${DESKTOP_MIN_PX}px)`;
export const MEDIA_DESKTOP = `(min-width: ${DESKTOP_MIN_PX}px)`;

export function isDesktopWidth(width: number) {
  return width >= DESKTOP_MIN_PX;
}

export function minWidthQuery(px: number) {
  return `(min-width: ${px}px)`;
}
