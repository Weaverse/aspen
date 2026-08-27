import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
  useTranslation,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef, useEffect, useState } from "react";
import { cn } from "~/utils/cn";

const ONE_SEC = 1000;
const ONE_MIN = ONE_SEC * 60;
const ONE_HOUR = ONE_MIN * 60;
const ONE_DAY = ONE_HOUR * 24;
const EMPTY_REMAINING_TIME = { days: 0, hours: 0, minutes: 0, seconds: 0 };

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
  scenario1MobileNumberSize?: number;
  scenario1DesktopNumberSize?: number;
  scenario2MobileNumberSize?: number;
  scenario2DesktopNumberSize?: number;
  mobileLabelSize?: number;
  desktopLabelSize?: number;
};

const CountdownTimer = forwardRef<
  HTMLDivElement,
  CountDownTimerData & HydrogenComponentProps
>((props, ref) => {
  const { t } = useTranslation();
  const {
    textColor,
    endTime,
    layout,
    scenario1MobileNumberSize = 48,
    scenario1DesktopNumberSize = 80,
    scenario2MobileNumberSize = 36,
    scenario2DesktopNumberSize = 48,
    mobileLabelSize = 10,
    desktopLabelSize = 12,
    ...rest
  } = props;
  // Get parent scenario using Weaverse's useParentInstance hook
  const parent = useParentInstance();
  const parentScenario = parent?.data?.scenario as
    | "scenario1"
    | "scenario2"
    | undefined;

  // Auto-detect layout: if scenario2, use vertical; otherwise use provided layout or default to horizontal
  const effectiveLayout =
    parentScenario === "scenario2" ? "vertical" : layout || "horizontal";
  // Keep the server and the first client render deterministic. The live value
  // is calculated immediately after hydration, then updated every second.
  const [remainingTime, setRemainingTime] = useState(EMPTY_REMAINING_TIME);

  useEffect(() => {
    const updateRemainingTime = () => {
      const updatedTimeRemaining = calculateRemainingTime(endTime);
      setRemainingTime(updatedTimeRemaining);
      if (
        updatedTimeRemaining.days <= 0 &&
        updatedTimeRemaining.hours <= 0 &&
        updatedTimeRemaining.minutes <= 0 &&
        updatedTimeRemaining.seconds <= 0
      ) {
        return false;
      }
      return true;
    };

    updateRemainingTime();
    const intervalId = setInterval(() => {
      if (!updateRemainingTime()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime]);

  const timerStyle: CSSProperties = {
    "--timer-color": textColor,
    "--timer-number-mobile": `${
      parentScenario === "scenario2"
        ? scenario2MobileNumberSize
        : scenario1MobileNumberSize
    }px`,
    "--timer-number-desktop": `${
      parentScenario === "scenario2"
        ? scenario2DesktopNumberSize
        : scenario1DesktopNumberSize
    }px`,
    "--timer-label-mobile": `${mobileLabelSize}px`,
    "--timer-label-desktop": `${desktopLabelSize}px`,
  } as CSSProperties;

  const isVertical = effectiveLayout === "vertical";

  const itemClass = cn(
    "flex min-w-0 items-end",
    isVertical ? "flex-col items-center gap-2" : "gap-1",
  );

  const numberPaddingClass =
    parentScenario === "scenario1" ? "px-0 md:px-2" : "px-0 md:px-5";
  const numberClass = cn(
    "ff-heading shrink-0 font-normal !leading-[0.8] [font-size:var(--timer-number-mobile)] md:[font-size:var(--timer-number-desktop)]",
    numberPaddingClass,
  );
  const labelClass =
    "min-w-0 whitespace-nowrap capitalize leading-none [font-size:var(--timer-label-mobile)] md:[font-size:var(--timer-label-desktop)]";

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "countdown--timer inline-grid gap-x-1 text-(--timer-color) sm:gap-x-2 md:gap-x-4",
        parentScenario === "scenario2"
          ? "w-full grid-cols-4"
          : "w-full grid-cols-2 gap-y-10 py-3 lg:grid-cols-4 lg:gap-y-0 lg:py-0",
      )}
      data-motion="fade-up"
      style={timerStyle}
    >
      <div className={itemClass}>
        <div className={numberClass}>
          {formatNumber(remainingTime?.days || 0)}
        </div>
        <div className={labelClass}>{t("countdown.days")}</div>
      </div>
      <div className={itemClass}>
        <div className={numberClass}>
          {formatNumber(remainingTime?.hours || 0)}
        </div>
        <div className={labelClass}>{t("countdown.hours")}</div>
      </div>
      <div className={itemClass}>
        <div className={numberClass}>
          {formatNumber(remainingTime?.minutes || 0)}
        </div>
        <div className={labelClass}>{t("countdown.minutes")}</div>
      </div>
      <div className={itemClass}>
        <div className={numberClass}>
          {formatNumber(remainingTime?.seconds || 0)}
        </div>
        <div className={labelClass}>{t("countdown.seconds")}</div>
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
        {
          type: "range",
          name: "scenario1MobileNumberSize",
          label: "Style 1 number size (mobile)",
          configs: { min: 24, max: 80, step: 2, unit: "px" },
          defaultValue: 48,
        },
        {
          type: "range",
          name: "scenario1DesktopNumberSize",
          label: "Style 1 number size (desktop)",
          configs: { min: 40, max: 120, step: 2, unit: "px" },
          defaultValue: 80,
        },
        {
          type: "range",
          name: "scenario2MobileNumberSize",
          label: "Style 2 number size (mobile)",
          configs: { min: 20, max: 64, step: 2, unit: "px" },
          defaultValue: 36,
        },
        {
          type: "range",
          name: "scenario2DesktopNumberSize",
          label: "Style 2 number size (desktop)",
          configs: { min: 28, max: 80, step: 2, unit: "px" },
          defaultValue: 48,
        },
        {
          type: "range",
          name: "mobileLabelSize",
          label: "Unit label size (mobile)",
          configs: { min: 8, max: 18, step: 1, unit: "px" },
          defaultValue: 10,
        },
        {
          type: "range",
          name: "desktopLabelSize",
          label: "Unit label size (desktop)",
          configs: { min: 8, max: 24, step: 1, unit: "px" },
          defaultValue: 12,
        },
      ],
    },
  ],
});
