export const TABLET_MAX_PX = 1032;
export const DESKTOP_MIN_PX = TABLET_MAX_PX + 1;

export function isDesktopViewport(width) {
  return width >= DESKTOP_MIN_PX;
}
