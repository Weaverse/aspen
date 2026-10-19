import { useLayoutEffect } from "react";

/** Snapshot the real gutter before Radix hides it. Keep compensation through
 * fade-out (and a Cart handoff) until the last body scroll lock is released. */
export function useQuickViewScrollbar(open: boolean) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!open || root.hasAttribute("data-quick-view-scrollbar")) {
      return;
    }
    const property = "--quick-view-scrollbar-gap";
    const previous = root.style.getPropertyValue(property);
    const priority = root.style.getPropertyPriority(property);
    const gap = Math.max(0, window.innerWidth - root.clientWidth);
    root.style.setProperty(property, `${gap}px`);
    root.setAttribute("data-quick-view-scrollbar", "");
    let releaseFrame: number | undefined;

    const release = () => {
      observer.disconnect();
      if (releaseFrame !== undefined) {
        cancelAnimationFrame(releaseFrame);
      }
      root.removeAttribute("data-quick-view-scrollbar");
      if (previous) {
        root.style.setProperty(property, previous, priority);
      } else {
        root.style.removeProperty(property);
      }
    };
    const observer = new MutationObserver(() => {
      if (releaseFrame !== undefined) {
        cancelAnimationFrame(releaseFrame);
      }
      if (!body.hasAttribute("data-scroll-locked")) {
        releaseFrame = requestAnimationFrame(() => {
          if (!body.hasAttribute("data-scroll-locked")) {
            release();
          }
        });
      }
    });
    observer.observe(body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });

    return () => {
      if (!body.hasAttribute("data-scroll-locked")) {
        release();
      }
    };
  }, [open]);
}
