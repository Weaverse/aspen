import type { ElementType } from "react";
import { cn } from "./utils/cn";

export function RevealUnderline({
  children,
  as: Component = "span",
  className,
}: {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Component
      className={cn(
        [
          "relative inline cursor-pointer",
          "after:absolute after:bottom-[-0.5px] after:left-0 after:h-[1px] after:w-full after:bg-[#6A4E4E]",
          "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
          "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
        ],
        className,
      )}
    >
      {children}
    </Component>
  );
}
