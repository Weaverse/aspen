import { useTranslation } from "@weaverse/hydrogen/react-router";
import { cn } from "~/utils/cn";

interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  maxQuantity?: number;
  disabled?: boolean;
  className?: string;
}

const stepperTypography =
  "font-dm-sans font-semibold not-italic leading-[normal] text-body";

const stepperButtonClassName =
  "flex w-11 shrink-0 flex-col items-center justify-center self-stretch focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-body disabled:cursor-not-allowed disabled:opacity-40";

export function Quantity(props: QuantityProps) {
  const { t } = useTranslation();
  const {
    value,
    onChange,
    maxQuantity = 10,
    disabled = false,
    className,
  } = props;

  return (
    <fieldset
      className={cn(
        "flex h-[54px] w-[175px] min-w-24 shrink-0 items-start overflow-hidden rounded-(--radius-sm) bg-(--color-background-subtle-2)",
        className,
      )}
      data-motion="fade-up"
    >
      <legend className="sr-only">{t("product.quantity")}</legend>
      <button
        type="button"
        className={stepperButtonClassName}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label={t("product.decreaseQuantity")}
      >
        <span
          aria-hidden="true"
          className={cn("text-[20px]", stepperTypography)}
        >
          -
        </span>
      </button>
      <span
        aria-hidden="true"
        className="w-px shrink-0 self-stretch bg-white/20"
      />
      <output
        className={cn(
          "flex min-w-0 flex-[1_0_0] flex-col items-center justify-center self-stretch text-[16px]",
          stepperTypography,
        )}
        aria-live="polite"
        aria-label={t(
          value === 1 ? "product.itemCount" : "product.itemCount_other",
          { count: value },
        )}
      >
        {value}
      </output>
      <span
        aria-hidden="true"
        className="w-px shrink-0 self-stretch bg-white/20"
      />
      <button
        type="button"
        className={stepperButtonClassName}
        onClick={() => onChange(Math.min(maxQuantity, value + 1))}
        disabled={disabled || value >= maxQuantity}
        aria-label={t("product.increaseQuantity")}
      >
        <span
          aria-hidden="true"
          className={cn("text-[20px]", stepperTypography)}
        >
          +
        </span>
      </button>
    </fieldset>
  );
}
