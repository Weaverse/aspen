import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef, useEffect, useState } from "react";
import { cn } from "~/utils/cn";

const ONE_SEC = 1000;
const ONE_MIN = ONE_SEC * 60;
const ONE_HOUR = ONE_MIN * 60;
const ONE_DAY = ONE_HOUR * 24;

function calculateRemainingTime(endTime: number) {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(diff / ONE_DAY),
    hours: Math.floor((diff % ONE_DAY) / ONE_HOUR),
    minutes: Math.floor((diff % ONE_HOUR) / ONE_MIN),
    seconds: Math.floor((diff % ONE_MIN) / ONE_SEC),
  };
}

// Add leading zero for numbers less than 10
function formatNumber(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

type CountDownTimerData = {
  textColor: string;
  endTime: number;
  layout?: "horizontal" | "vertical";
};

const CountdownTimer = forwardRef<
  HTMLDivElement,
  CountDownTimerData & HydrogenComponentProps
>((props, ref) => {
  const { textColor, endTime, layout, ...rest } = props;
  // Get parent scenario using Weaverse's useParentInstance hook
  const parent = useParentInstance();
  const parentScenario = parent?.data?.scenario as
    | "scenario1"
    | "scenario2"
    | undefined;

  // Auto-detect layout: if scenario2, use vertical; otherwise use provided layout or default to horizontal
  const effectiveLayout =
    parentScenario === "scenario2" ? "vertical" : layout || "horizontal";
  const [remainingTime, setRemainingTime] = useState(
    calculateRemainingTime(endTime),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      const updatedTimeRemaining = calculateRemainingTime(endTime);
      setRemainingTime(updatedTimeRemaining);
      if (
        updatedTimeRemaining.days <= 0 &&
        updatedTimeRemaining.hours <= 0 &&
        updatedTimeRemaining.minutes <= 0 &&
        updatedTimeRemaining.seconds <= 0
      ) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime]);

  const timerStyle: CSSProperties = {
    "--timer-color": textColor,
  } as CSSProperties;

  const isVertical = effectiveLayout === "vertical";

  const itemClass = cn(
    "flex",
    isVertical ? ["flex-col", "items-center", "gap-2"] : "items-end",
  );

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "countdown--timer inline-grid py-3 text-(--timer-color) sm:py-0",
        parentScenario === "scenario2" ? "grid-cols-4" : "grid-cols-2 lg:grid-cols-4",
      )}
      data-motion="fade-up"
      style={timerStyle}
    >
      <div className={itemClass}>
        <div className="flex items-end font-medium text-4xl leading-tight md:text-5xl">
          <div className="ff-heading px-6 leading-10">
            {remainingTime?.days || 0}
          </div>
        </div>
        <div className="text-sm capitalize md:text-base">Days</div>
      </div>
      <div className={itemClass}>
        <div className="flex items-end font-medium text-4xl leading-tight md:text-5xl">
          <div className="ff-heading px-6 leading-10">
            {formatNumber(remainingTime?.hours || 0)}
          </div>
        </div>
        <div className="text-sm capitalize md:text-base">hours</div>
      </div>
      <div className={itemClass}>
        <div className="flex items-end font-medium text-4xl leading-tight md:text-5xl">
          <div className="ff-heading px-6 leading-10">
            {formatNumber(remainingTime?.minutes || 0)}
          </div>
        </div>
        <div className="text-sm capitalize md:text-base">minutes</div>
      </div>
      <div className={itemClass}>
        <div className="flex items-end font-medium text-4xl leading-tight md:text-5xl">
          <div className="ff-heading px-6 leading-10">
            {formatNumber(remainingTime?.seconds || 0)}
          </div>
        </div>
        <div className="text-sm capitalize md:text-base">seconds</div>
      </div>
    </div>
  );
});

export default CountdownTimer;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

export const schema = createSchema({
  type: "countdown--timer",
  title: "Timer",
  settings: [
    {
      group: "Timer",
      inputs: [
        {
          type: "datepicker",
          label: "End time",
          name: "endTime",
          defaultValue: tomorrow.getTime(),
        },
        {
          type: "color",
          name: "textColor",
          label: "Text color",
        },
      ],
    },
  ],
});
