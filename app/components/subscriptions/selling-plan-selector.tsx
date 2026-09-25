import { CaretDownIcon } from "@phosphor-icons/react";
import * as Select from "@radix-ui/react-select";
import { useTranslation } from "@weaverse/hydrogen";
import { useId, useState } from "react";
import { useRouteLoaderData } from "react-router";
import { useLocale } from "~/hooks/use-locale";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { cn } from "~/utils/cn";
import { formatSymbolAmount } from "~/utils/locale";

interface SellingPlanSelectorProps {
  variant: any;
  selectedSellingPlanId?: string;
  onSellingPlanChange: (sellingPlanId: string | null) => void;
  className?: string;
  product?: any; // Optional product prop for use in QuickShop
}

export function SellingPlanSelector({
  variant,
  selectedSellingPlanId,
  onSellingPlanChange,
  className,
  product: productProp,
}: SellingPlanSelectorProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const loaderData = useRouteLoaderData<typeof productRouteLoader>(
    "routes/($locale).products.$productHandle",
  );
  const product = productProp || loaderData?.product;
  const selectorId = useId();
  const radioName = `selling-plan-${selectorId}`;
  const oneTimeId = `${selectorId}-one-time`;
  const subscriptionId = `${selectorId}-subscription`;

  const sellingPlanGroups = product?.sellingPlanGroups?.edges || [];
  const sellingPlans = sellingPlanGroups.flatMap((group) =>
    group.node.sellingPlans.edges.map((plan) => plan.node),
  );

  const defaultPlanId = sellingPlans[0]?.id;
  const [preferredPlanId, setPreferredPlanId] = useState<string | null>(
    selectedSellingPlanId || null,
  );
  const dropdownValue =
    selectedSellingPlanId || preferredPlanId || defaultPlanId || "";

  if (sellingPlans.length === 0) {
    return null;
  }

  const calculateSubscriptionPrice = (
    basePrice: { amount: string; currencyCode: string },
    sellingPlan: any,
  ) => {
    const text = `${sellingPlan.name} ${sellingPlan.description || ""}`;
    const percentageMatch = text.match(/(\d+)%/);

    if (percentageMatch) {
      const percentage = Number.parseInt(percentageMatch[1], 10);
      const baseAmount = Number.parseFloat(basePrice.amount);
      const discount = (baseAmount * percentage) / 100;
      return {
        amount: (baseAmount - discount).toFixed(2),
        currencyCode: basePrice.currencyCode as any,
      };
    }

    return basePrice;
  };

  const formatPlanDisplayText = (sellingPlan: any) => {
    const subscriptionPrice = calculateSubscriptionPrice(
      variant.price,
      sellingPlan,
    );
    const baseAmount = Number.parseFloat(variant.price.amount);
    const subscriptionAmount = Number.parseFloat(subscriptionPrice.amount);
    const savings = baseAmount - subscriptionAmount;

    const savingsLabel =
      savings > 0
        ? formatSymbolAmount(savings, variant.price.currencyCode, locale)
        : null;

    const deliveryOption = sellingPlan.options?.find(
      (opt: any) =>
        opt.name?.toLowerCase().includes("deliver") ||
        opt.name?.toLowerCase().includes("frequency") ||
        opt.name?.toLowerCase().includes("interval"),
    );

    let frequencyText = deliveryOption?.value || "";
    let extractedNumber: string | null = null;
    let extractedUnit: string | null = null;

    if (frequencyText) {
      frequencyText = frequencyText
        .replace(/deliver\s+every\s+/gi, "")
        .replace(/deliver\s+/gi, "")
        .replace(/every\s+/gi, "")
        .trim();

      // Try to extract number and unit from the cleaned text
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

    if (!(extractedNumber && extractedUnit)) {
      const frequencyMatch =
        sellingPlan.name.match(
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

    if (extractedNumber && extractedUnit) {
      const normalizedUnit = extractedUnit.endsWith("s")
        ? extractedUnit
        : `${extractedUnit}s`;
      frequencyText = `${extractedNumber} ${normalizedUnit}`;
    }

    return {
      frequency: frequencyText || "",
      savings: savingsLabel,
      fallback: (() => {
        const cleanedName = sellingPlan.name
          .replace(/deliver\s+every\s+/gi, "")
          .replace(/deliver\s+/gi, "")
          .replace(/every\s+/gi, "")
          .trim();
        return cleanedName || sellingPlan.name;
      })(),
    };
  };

  const renderPlanText = (sellingPlan: any) => {
    const planData = formatPlanDisplayText(sellingPlan);

    if (planData.frequency && planData.savings) {
      return (
        <>
          <span style={{ color: "#29231E" }}>{planData.frequency} - </span>
          <span style={{ color: "#918379" }}>
            {t("subscription.save", { amount: planData.savings })}
          </span>
        </>
      );
    }
    if (planData.frequency) {
      return <span style={{ color: "#29231E" }}>{planData.frequency}</span>;
    }
    if (planData.savings) {
      return (
        <span style={{ color: "#918379" }}>
          {t("subscription.save", { amount: planData.savings })}
        </span>
      );
    }

    return <span style={{ color: "#29231E" }}>{planData.fallback}</span>;
  };

  const isSubscriptionSelected =
    selectedSellingPlanId !== null && selectedSellingPlanId !== undefined;
  const displaySellingPlan = sellingPlans.find(
    (plan) =>
      plan.id ===
      (isSubscriptionSelected ? selectedSellingPlanId : dropdownValue),
  );

  return (
    <div className={cn("flex flex-col gap-3 text-[#343231]", className)}>
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id={oneTimeId}
          name={radioName}
          value="one-time"
          checked={!isSubscriptionSelected}
          onChange={() => {
            onSellingPlanChange(null);
          }}
          className="h-5 w-5 border-line text-body focus:ring-0"
          style={{
            accentColor: "var(--color-body)",
          }}
        />
        <label
          htmlFor={oneTimeId}
          className="cursor-pointer font-body text-sm leading-[1.6] tracking-[0.14px]"
        >
          {t("subscription.oneTimePurchase")}
        </label>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id={subscriptionId}
            name={radioName}
            value="subscription"
            checked={isSubscriptionSelected}
            onChange={() => {
              const planToSelect =
                dropdownValue ||
                (sellingPlans.length > 0 ? sellingPlans[0].id : null);
              if (planToSelect) {
                onSellingPlanChange(planToSelect);
                setPreferredPlanId(planToSelect);
              }
            }}
            className="h-5 w-5 border-line text-body focus:ring-0"
            style={{
              accentColor: "var(--color-body)",
            }}
          />
          <div className="flex items-center gap-2 pt-0.5">
            <label
              htmlFor={subscriptionId}
              className="cursor-pointer font-body text-sm leading-[1.6] tracking-[0.14px]"
            >
              {t("subscription.deliverEvery")}
            </label>
            <Select.Root
              value={dropdownValue}
              onValueChange={(value) => {
                setPreferredPlanId(value);
                if (isSubscriptionSelected) {
                  onSellingPlanChange(value);
                }
              }}
              disabled={!isSubscriptionSelected}
            >
              <Select.Trigger
                className={cn(
                  "inline-flex items-center gap-2.5 border-line border-b bg-white pb-0 font-semibold outline-hidden",
                  isSubscriptionSelected
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50",
                )}
                aria-label={t("subscription.selectDeliveryFrequency")}
              >
                <Select.Value
                  placeholder={t("subscription.selectPlan")}
                  className="font-body text-sm leading-[1.6] tracking-[0.14px]"
                >
                  {displaySellingPlan
                    ? renderPlanText(displaySellingPlan)
                    : t("subscription.selectPlan")}
                </Select.Value>
                <Select.Icon className="shrink-0">
                  <CaretDownIcon size={12} className="text-body" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
                  <Select.Viewport className="p-1">
                    {sellingPlans.map((sellingPlan) => (
                      <Select.Item
                        key={sellingPlan.id}
                        value={sellingPlan.id}
                        className="flex h-8 w-full cursor-pointer select-none items-center rounded px-3 py-1 font-body text-sm font-normal leading-[1.6] tracking-[0.14px] outline-hidden hover:bg-gray-100 data-[state=checked]:font-semibold data-[state=checked]:tracking-[0.28px]"
                      >
                        <Select.ItemText>
                          {renderPlanText(sellingPlan)}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
