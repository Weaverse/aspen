/**
 * Theme viewport scale. Tablet includes 1024px (iPad landscape).
 *
 * Mobile:  < 768
 * Tablet:  768–1024
 * Desktop: 1025+
 *
 * CSS mirrors this via `--breakpoint-md` (768) and `--breakpoint-lg` / `--breakpoint-desktop` (1025).
 */
export const MOBILE_MAX_PX = 767;
export const TABLET_MIN_PX = 768;
export const TABLET_MAX_PX = 1024;
export const DESKTOP_MIN_PX = 1025;

export const MEDIA_MOBILE = `(max-width: ${MOBILE_MAX_PX}px)`;
export const MEDIA_FROM_TABLET = `(min-width: ${TABLET_MIN_PX}px)`;
export const MEDIA_UNTIL_DESKTOP = `(max-width: ${TABLET_MAX_PX}px)`;
export const MEDIA_DESKTOP = `(min-width: ${DESKTOP_MIN_PX}px)`;

export function isDesktopWidth(width: number) {
  return width >= DESKTOP_MIN_PX;
}

export function minWidthQuery(px: number) {
  return `(min-width: ${px}px)`;
}
