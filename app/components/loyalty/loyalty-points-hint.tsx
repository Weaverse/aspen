import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import { Suspense } from "react";
import { Await, useRouteLoaderData } from "react-router";
import { Link } from "~/components/link";
import type { RootLoader } from "~/root";
import type { LoyaltyBalance } from "~/types/loyalty";
import { estimateLoyaltyPoints } from "~/utils/loyalty";

export function LoyaltyPointsHint({
  amount,
  className,
}: {
  amount?: number | string | null;
  className?: string;
}) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const vendorConfigured = Boolean(rootData?.integrations?.loyaltyLion);
  const resolvedClassName = className ?? "text-body-subtle text-sm";

  if (!rootData?.loyalty) {
    return (
      <LoyaltyHintBody
        amount={amount}
        loyalty={{
          vendor: vendorConfigured ? "loyaltylion" : "none",
          points: null,
        }}
        vendorConfigured={vendorConfigured}
        className={resolvedClassName}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <LoyaltyHintBody
          amount={amount}
          loyalty={{
            vendor: vendorConfigured ? "loyaltylion" : "none",
            points: null,
          }}
          vendorConfigured={vendorConfigured}
          className={resolvedClassName}
        />
      }
    >
      <Await resolve={rootData.loyalty}>
        {(loyalty) => (
          <LoyaltyHintBody
            amount={amount}
            loyalty={loyalty}
            vendorConfigured={vendorConfigured}
            className={resolvedClassName}
          />
        )}
      </Await>
    </Suspense>
  );
}

function LoyaltyHintBody({
  amount,
  loyalty,
  vendorConfigured,
  className,
}: {
  amount?: number | string | null;
  loyalty: LoyaltyBalance;
  vendorConfigured: boolean;
  className: string;
}) {
  const { t } = useTranslation();
  const {
    enableLoyaltyHint,
    loyaltyPointsPerCurrency = 1,
    loyaltyProgramName = "Rewards",
    loyaltyLearnMoreUrl,
  } = useThemeSettings();

  if (!enableLoyaltyHint && !vendorConfigured) {
    return null;
  }

  // Earning rules live in the vendor admin, so a theme-configured rate would
  // contradict them. Only estimate when no loyalty vendor is connected.
  const earnPoints = vendorConfigured
    ? 0
    : estimateLoyaltyPoints(amount, loyaltyPointsPerCurrency);
  const balance =
    loyalty.vendor === "loyaltylion" && typeof loyalty.points === "number"
      ? loyalty.points
      : null;

  if (earnPoints <= 0 && balance === null) {
    return null;
  }

  return (
    <p className={className}>
      {balance !== null
        ? t("loyalty.balance", {
            points: balance,
            program: loyaltyProgramName,
          })
        : null}
      {balance !== null && earnPoints > 0 ? " " : null}
      {earnPoints > 0
        ? t("loyalty.earnHint", {
            points: earnPoints,
            program: loyaltyProgramName,
          })
        : null}
      {typeof loyaltyLearnMoreUrl === "string" && loyaltyLearnMoreUrl ? (
        <>
          {" "}
          <Link
            to={loyaltyLearnMoreUrl}
            className="underline underline-offset-4"
          >
            {t("loyalty.learnMore")}
          </Link>
        </>
      ) : null}
    </p>
  );
}
