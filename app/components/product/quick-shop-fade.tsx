import clsx from "clsx";
import { usePresence, useReducedMotion } from "framer-motion";
import { type ComponentPropsWithoutRef, useEffect } from "react";

/** Keep the final opacity until Presence removes the node. Native accelerated
 * opacity animations can revert to their inline value before React unmounts. */
export function QuickShopFade({
  className,
  children,
}: Pick<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  const [isPresent, safeToRemove] = usePresence();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isPresent && reduceMotion) {
      safeToRemove?.();
    }
  }, [isPresent, reduceMotion, safeToRemove]);

  return (
    <div
      className={clsx(
        className,
        isPresent ? "quick-view-fade-in" : "quick-view-fade-out",
      )}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && !isPresent) {
          safeToRemove?.();
        }
      }}
    >
      {children}
    </div>
  );
}
