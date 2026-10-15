import clsx from "clsx";
import { usePresence, useReducedMotion } from "framer-motion";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Keep the final opacity until Presence removes the node. Native accelerated
 * opacity animations can revert to their inline value before React unmounts. */
export function QuickShopFade({
  className,
  children,
}: Pick<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  const [isPresent, safeToRemove] = usePresence();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [exitOpacity, setExitOpacity] = useState<string | null>(null);
  const exiting = !isPresent && (reduceMotion || exitOpacity !== null);

  useLayoutEffect(() => {
    if (isPresent) {
      setExitOpacity(null);
    } else if (!reduceMotion && ref.current) {
      // Keep the opening class until this snapshot: switching to the exit
      // animation first would replace the rendered opacity with its keyframe.
      setExitOpacity(getComputedStyle(ref.current).opacity);
    }
  }, [isPresent, reduceMotion]);

  useEffect(() => {
    if (!isPresent && reduceMotion) {
      safeToRemove?.();
    }
  }, [isPresent, reduceMotion, safeToRemove]);

  return (
    <div
      ref={ref}
      style={
        exitOpacity === null
          ? undefined
          : ({ "--quick-view-exit-opacity": exitOpacity } as CSSProperties)
      }
      className={clsx(
        className,
        exiting ? "quick-view-fade-out" : "quick-view-fade-in",
      )}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          exiting &&
          event.animationName === "quick-view-fade-out"
        ) {
          safeToRemove?.();
        }
      }}
    >
      {children}
    </div>
  );
}
