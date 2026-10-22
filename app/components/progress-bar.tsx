import type { ComponentProps, CSSProperties, Ref } from "react";
import { cn } from "~/utils/cn";

const trackClassName = "overflow-hidden rounded-(--radius-sm)";

interface ProgressBarProps extends Omit<ComponentProps<"div">, "children"> {
  value?: number;
  indicatorClassName?: string;
  indicatorRef?: Ref<HTMLDivElement>;
}

/** Layout and progress calculation stay with the caller; palette/radius are shared. */
export function ProgressBar({
  value,
  className,
  indicatorClassName,
  indicatorRef,
  ...props
}: ProgressBarProps) {
  return (
    <div
      className={cn(trackClassName, "bg-progress-track", className)}
      {...props}
    >
      <div
        ref={indicatorRef}
        className={cn(
          "rounded-(--radius-sm) bg-progress-active",
          indicatorClassName,
        )}
        style={value === undefined ? undefined : { width: `${value}%` }}
      />
    </div>
  );
}

interface SegmentedProgressBarProps
  extends Omit<ComponentProps<"div">, "children"> {
  count: number;
  activeIndex: number;
  cumulative?: boolean;
  markCurrent?: boolean;
  onSegmentSelect: (index: number) => void;
  getLabel: (index: number) => string;
  segmentClassName?: string;
  segmentStyle?: CSSProperties;
}

export function SegmentedProgressBar({
  count,
  activeIndex,
  cumulative = false,
  markCurrent = false,
  onSegmentSelect,
  getLabel,
  className,
  segmentClassName,
  segmentStyle,
  ...props
}: SegmentedProgressBarProps) {
  if (count === 0) {
    return null;
  }
  return (
    <div className={cn(trackClassName, "flex", className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className={cn(
            "dot cursor-pointer border-0 bg-progress-track p-0 outline-none",
            segmentClassName,
            (cumulative ? index <= activeIndex : index === activeIndex) &&
              "!bg-progress-active",
          )}
          style={segmentStyle}
          onClick={() => onSegmentSelect(index)}
          aria-label={getLabel(index)}
          aria-current={
            markCurrent && index === activeIndex ? "true" : undefined
          }
        />
      ))}
    </div>
  );
}
