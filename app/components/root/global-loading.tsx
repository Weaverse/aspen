import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { ProgressBar } from "~/components/progress-bar";

export function GlobalLoading() {
  const transition = useNavigation();
  const active = transition.state !== "idle";

  const ref = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    Promise.allSettled(
      ref.current.getAnimations().map(({ finished }) => finished),
    ).then(() => {
      if (!active) {
        setAnimating(false);
      }
    });

    if (active) {
      const id = setTimeout(() => setAnimating(true), 100);
      return () => clearTimeout(id);
    }
  }, [active]);

  return (
    <ProgressBar
      aria-hidden={!active}
      className={clsx(
        "fixed inset-x-0 top-0 left-0 z-50 h-1 animate-pulse",
        !active && "bg-transparent",
      )}
      indicatorRef={ref}
      indicatorClassName={clsx(
        "h-full transition-all duration-500 ease-in-out",
        transition.state === "idle" &&
          (animating ? "w-full" : "w-0 opacity-0 transition-none"),
        transition.state === "submitting" && "w-4/12",
        transition.state === "loading" && "w-10/12",
      )}
    />
  );
}
