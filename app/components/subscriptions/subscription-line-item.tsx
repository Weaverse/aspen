import { ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "~/utils/cn";

interface SubscriptionLineItemProps {
  line: any;
  className?: string;
}

export function SubscriptionLineItem({
  line,
  className,
}: SubscriptionLineItemProps) {
  const sellingPlanAllocation = line.sellingPlanAllocation;

  if (!sellingPlanAllocation) {
    return null;
  }

  const { sellingPlan } = sellingPlanAllocation;

  const formatDeliveryFrequency = () => {
    if (!sellingPlan) return "";

    // Try to extract frequency from selling plan options
    const deliveryOption = sellingPlan.options?.find(
      (opt: any) =>
        opt.name?.toLowerCase().includes("deliver") ||
        opt.name?.toLowerCase().includes("frequency") ||
        opt.name?.toLowerCase().includes("interval"),
    );

    let frequencyText = deliveryOption?.value || "";

    // Clean up frequencyText - remove "Deliver every", "deliver", "every" etc.
    if (frequencyText) {
      frequencyText = frequencyText
        .replace(/deliver\s+every\s+/gi, "")
        .replace(/deliver\s+/gi, "")
        .replace(/every\s+/gi, "")
        .trim();
    }

    // Extract number and unit
    let extractedNumber: string | null = null;
    let extractedUnit: string | null = null;

    if (frequencyText) {
      const match = frequencyText.match(
        /(\d+)\s*(week|month|year|weeks|months|years)/i,
      );
      if (match) {
        extractedNumber = match[1];
        extractedUnit = match[2].toLowerCase();
      } else {
        const unitMatch = frequencyText.match(
          /\b(year|years|month|months|week|weeks)\b/i,
        );
        if (unitMatch) {
          extractedUnit = unitMatch[1].toLowerCase();
          extractedNumber = "1";
        }
      }
    }

    // Try to extract from name or description if not found
    if (!(extractedNumber && extractedUnit)) {
      const frequencyMatch =
        sellingPlan.name?.match(
          /(\d+)\s*(week|month|year|weeks|months|years)/i,
        ) ||
        sellingPlan.description?.match(
          /(\d+)\s*(week|month|year|weeks|months|years)/i,
        );

      if (frequencyMatch) {
        extractedNumber = frequencyMatch[1];
        extractedUnit = frequencyMatch[2].toLowerCase();
      }
    }

    // Format the text
    if (extractedNumber && extractedUnit) {
      const normalizedUnit = extractedUnit.endsWith("s")
        ? extractedUnit
        : `${extractedUnit}s`;
      return `Deliver every ${extractedNumber} ${normalizedUnit}`;
    }

    // Fallback
    if (sellingPlan.name) {
      return `Deliver every ${sellingPlan.name}`;
    }

    return sellingPlan.recurringDeliveries ? "Recurring delivery" : "";
  };

  const deliveryText = formatDeliveryFrequency();

  if (!deliveryText) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#EBE8E5] px-2 py-0.5",
        className,
      )}
      style={{
        paddingTop: "3px",
        paddingBottom: "4px",
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      <ArrowsClockwise size={12} style={{ color: "#918379" }} />
      <span
        className="text-[#918379] leading-none"
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontWeight: 400,
          fontSize: "12px",
          lineHeight: "1em",
          letterSpacing: "0.02em",
        }}
      >
        {deliveryText}
      </span>
    </div>
  );
}
