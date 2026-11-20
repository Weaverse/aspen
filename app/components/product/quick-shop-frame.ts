// Mobile Quick View keeps the page visible around a centered, scrollable panel.
// Match the 400 × 872 design while leaving room around shorter viewports.
export const QUICK_SHOP_MOBILE_FRAME_CLASS =
  "left-[calc((100%-var(--quick-view-locked-gap,0px))/2)] top-1/2 h-[calc(100dvh-var(--spacing)*8)] max-h-[872px] w-[calc(100%-var(--quick-view-locked-gap,0px)-var(--spacing)*8)] max-w-[400px] -translate-x-1/2 -translate-y-1/2";
