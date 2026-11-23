import { useEffect, useState } from "react";
import { MEDIA_MOBILE } from "~/utils/breakpoints";

// Mobile Quick View keeps the page visible around a centered, scrollable panel.
// Match the 400 × 872 design while leaving room around shorter viewports.
export const QUICK_SHOP_MOBILE_FRAME_CLASS =
  "left-[calc((100%-var(--quick-view-locked-gap,0px))/2)] top-1/2 h-[calc(100dvh-var(--spacing)*8)] max-h-[872px] w-[calc(100%-var(--quick-view-locked-gap,0px)-var(--spacing)*8)] max-w-[400px] -translate-x-1/2 -translate-y-1/2";

export const QUICK_SHOP_DESKTOP_FRAME_CLASS =
  "top-1/2 left-[calc((100%-var(--quick-view-locked-gap,0px))/2)] w-[calc(100%-var(--quick-view-locked-gap,0px)-var(--spacing)*12)] max-w-[801px] lg:max-w-[1375px] -translate-x-1/2 -translate-y-1/2";

export const QUICK_SHOP_DESKTOP_SURFACE_CLASS =
  "relative h-[min(783px,calc(100dvh-var(--spacing)*12))] max-h-[calc(100dvh-var(--spacing)*12)] w-full overflow-y-auto rounded-xl bg-background p-6 lg:h-auto";

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
