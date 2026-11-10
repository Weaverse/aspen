// Cart and its nested action sheets share one frame. Other drawers are unchanged.
export const CART_DRAWER_WIDTH_CLASS =
  "w-[calc(100vw-var(--page-padding))] max-w-[430px]";
export const CART_DRAWER_RADIUS_CLASS =
  "rounded-l-(--radius-md) rounded-r-none";

export const DRAWER_LINE_CLASS = "flex gap-4 max-md:min-w-0 max-md:w-full";
export const DRAWER_LINE_MEDIA_CLASS =
  "shrink-0 rounded-(--radius-md) bg-(--color-background-subtle)/50 max-xl:w-[clamp(100px,32.56vw,140px)] max-md:relative max-md:h-[140px] max-md:min-w-0 max-md:flex-[1_0_0] max-md:self-start max-md:overflow-hidden";
export const DRAWER_LINE_IMAGE_CLASS =
  "h-auto w-[140px] rounded-xl max-xl:aspect-square max-xl:h-full max-xl:max-h-[140px] max-xl:w-full max-md:absolute max-md:inset-0 max-md:aspect-auto max-md:max-h-none max-md:rounded-(--radius-md)";
export const DRAWER_LINE_BODY_CLASS =
  "min-w-0 grow justify-between gap-4 max-xl:min-h-[140px] max-xl:text-sm max-md:min-w-min max-md:basis-3/5 max-md:grow-0 max-md:shrink-0 max-md:gap-2 max-md:wrap-anywhere";
export const DRAWER_LINE_TITLE_CLASS =
  "max-xl:line-clamp-2 xl:line-clamp-1 font-semibold uppercase max-md:line-clamp-1";

export const CART_DRAWER_QUANTITY_SIZE_CLASS = "h-7.5 w-30";
