import { useThemeSettings } from "@weaverse/hydrogen";
import { animate, inView, useAnimate } from "framer-motion";
import { type ForwardedRef, useEffect, useRef } from "react";

export type MotionType = "fade-up" | "zoom-in" | "slide-in";

const ANIMATIONS: Record<MotionType, any> = {
  "fade-up": { opacity: [0, 1], y: [20, 0] },
  "zoom-in": { opacity: [0, 1], scale: [0.8, 1], y: [20, 0] },
  "slide-in": { opacity: [0, 1], x: [20, 0] },
};

export function useAnimation(ref?: ForwardedRef<any>, isActive?: boolean) {
  const { revealElementsOnScroll } = useThemeSettings();
  const [scope] = useAnimate();
  const hasBeenActive = useRef(false);

  useEffect(() => {
    if (!(scope.current && ref)) {
      return;
    }
    Object.assign(ref, { current: scope.current });
  }, [scope, ref]);

  useEffect(() => {
    if (!revealElementsOnScroll) {
      return;
    }

    const currentScope: HTMLElement = scope.current;
    if (!currentScope) {
      return;
    }
    const hadAnimatedScope = currentScope.classList.contains("animated-scope");
    currentScope.classList.add("animated-scope");
    // Nested hooks own their descendants. Otherwise an ancestor can capture
    // their temporary opacity: 0 and restore it after the child has revealed.
    const elems = Array.from(
      currentScope.querySelectorAll<HTMLElement>("[data-motion]"),
    ).filter(
      (elem) => elem.parentElement?.closest(".animated-scope") === currentScope,
    );
    const originalStyles = elems.map((elem) => ({
      opacity: elem.style.opacity,
      transform: elem.style.transform,
    }));
    const observers: (() => void)[] = [];
    const animations: ReturnType<typeof animate>[] = [];
    let cancelled = false;

    // Prepare unseen slides and reset incoming content for its next reveal.
    // Once shown, outgoing content stays visible and transitions with Swiper.
    if (isActive !== false || !hasBeenActive.current) {
      for (const elem of elems) {
        elem.style.opacity = "0";
      }
    }

    // Fade slides overlap in the viewport, so visibility alone cannot tell
    // which slide should reveal its content. Other sections omit isActive.
    if (isActive !== false) {
      hasBeenActive.current = true;
      for (const [idx, elem] of elems.entries()) {
        observers.push(
          inView(
            elem,
            () => {
              const { motion, delay } = elem.dataset;
              const animation = animate(elem, ANIMATIONS[motion || "fade-up"], {
                delay: Number(delay) || idx * 0.15,
                duration: 0.5,
              });
              animations.push(animation);
              animation.then(() => {
                if (!cancelled) {
                  elem.style.transform = originalStyles[idx].transform;
                  elem.style.opacity = originalStyles[idx].opacity;
                }
              });
            },
            { amount: 0.3 },
          ),
        );
      }
    }

    return () => {
      cancelled = true;
      for (const stopObserving of observers) {
        stopObserving();
      }
      for (const animation of animations) {
        animation.stop();
      }
      for (const [idx, elem] of elems.entries()) {
        elem.style.opacity = originalStyles[idx].opacity;
        elem.style.transform = originalStyles[idx].transform;
      }
      if (!hadAnimatedScope) {
        currentScope.classList.remove("animated-scope");
      }
    };
  }, [revealElementsOnScroll, scope, isActive]);

  return [scope] as const;
}
