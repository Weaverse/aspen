import { useEffect, useState } from "react";
import { MEDIA_MOBILE } from "~/utils/breakpoints";

// Mobile Quick View keeps the page visible around a centered, scrollable panel.
// Inline gutters use the spacing scale; the height is relative to the viewport.
export const QUICK_SHOP_MOBILE_FRAME_CLASS =
  "left-4 right-[calc(var(--spacing)*4+var(--quick-view-locked-gap,0px))] top-1/2 h-[75dvh] -translate-y-1/2";

export const QUICK_SHOP_DESKTOP_FRAME_CLASS =
  "top-1/2 left-[calc((100%-var(--quick-view-locked-gap,0px))/2)] w-[calc(100%-var(--quick-view-locked-gap,0px)-48px)] max-w-[1375px] -translate-x-1/2 -translate-y-1/2";

export const QUICK_SHOP_DESKTOP_SURFACE_CLASS =
  "relative max-h-[calc(100dvh-48px)] w-full overflow-y-auto rounded-xl bg-background p-6";

export const QUICK_SHOP_MOBILE_SURFACE_CLASS =
  "h-full w-full overflow-hidden rounded-(--radius-md) bg-background";

export const QUICK_SHOP_OVERLAY_CLASS =
  "fixed inset-0 z-10 bg-black/50 backdrop-blur-xs";

export function useQuickShopMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(MEDIA_MOBILE);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}
