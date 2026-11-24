// Keep wishlist popup geometry independent of Quickview sizing.
export const WISHLIST_POPUP_MOBILE_FRAME_CLASS =
  "left-4 right-[calc(var(--spacing)*4+var(--quick-view-locked-gap,0px))] top-1/2 h-[75dvh] -translate-y-1/2";

export const WISHLIST_POPUP_DESKTOP_FRAME_CLASS =
  "top-1/2 left-[calc((100%-var(--quick-view-locked-gap,0px))/2)] w-[calc(100%-var(--quick-view-locked-gap,0px)-48px)] max-w-[1375px] -translate-x-1/2 -translate-y-1/2";

export const WISHLIST_POPUP_MOBILE_SURFACE_CLASS =
  "h-full w-full overflow-hidden rounded-(--radius-md) bg-background";

export const WISHLIST_POPUP_DESKTOP_SURFACE_CLASS =
  "relative max-h-[calc(100dvh-48px)] w-full overflow-y-auto rounded-xl bg-background p-6";
