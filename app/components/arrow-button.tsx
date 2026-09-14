import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "~/utils/cn";

/** Shared presentation for previous/next controls; callers own navigation. */
export const ArrowButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & { tone?: "overlay" | "neutral"; customizable?: boolean }
>(({ className, type = "button", tone = "overlay", customizable = false, ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    {...props}
    className={cn(
      !customizable && className,
      "inline-flex h-auto w-auto shrink-0 items-center justify-center gap-2 rounded-[var(--Radius-border-radius-md,12px)] border-0 bg-white/80 p-[var(--p-12,12px)] text-[#524B46] shadow-none",
      "hover:bg-white/80 hover:text-[#524B46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed",
      "[&>svg]:size-6 [&>svg]:shrink-0",
      tone === "neutral" && "flex bg-[#EDEAE6] hover:bg-[#EDEAE6]",
      customizable && className,
    )}
  />
));
