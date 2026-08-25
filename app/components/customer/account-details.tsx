import { useTranslation } from "@weaverse/hydrogen";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import type { HTMLAttributes } from "react";
import { Link } from "~/components/link";
import { cn } from "~/utils/cn";

export function AccountDetails({
  customer,
  heading = "ACCOUNT",
  editText = "EDIT",
  className,
  ...rest
}: {
  customer: CustomerDetailsFragment;
  heading?: string;
  editText?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const { t } = useTranslation();
  const { firstName, lastName, emailAddress } = customer;
  return (
    <div {...rest} className={cn(className)}>
      <h2 className="font-body font-normal text-[#343231] text-sm uppercase leading-5 tracking-[0.02em]">
        {heading}
      </h2>
      <div className="mt-[13px] flex min-h-[227px] flex-col bg-white p-5 font-body text-[#343231] text-sm leading-5">
        <div className="space-y-4">
          <div>
            <div>{t("account.firstName")}</div>
            <div className="font-semibold">
              {firstName || t("account.notAvailable")}
            </div>
          </div>
          <div>
            <div>{t("account.lastName")}</div>
            <div className="font-semibold">
              {lastName || t("account.notAvailable")}
            </div>
          </div>
          <div>
            <div>{t("account.email")}</div>
            <div className="break-all font-semibold">
              {emailAddress?.emailAddress ?? t("account.notAvailable")}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Link
            prefetch="intent"
            className="text-[#979797] text-xs uppercase leading-5 transition-opacity hover:opacity-70"
            to="/account/edit"
          >
            {editText}
          </Link>
        </div>
      </div>
    </div>
  );
}
