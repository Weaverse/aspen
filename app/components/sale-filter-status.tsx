import { useTranslation } from "@weaverse/hydrogen";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";

export function SaleFilterStatus() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const saleOnly = params.get("sale") === "true";
  if (!saleOnly) {
    return null;
  }
  const cleared = new URLSearchParams(params);
  cleared.delete("sale");
  for (const key of [...cleared.keys()]) {
    if (/cursor|direction/i.test(key)) {
      cleared.delete(key);
    }
  }
  return (
    <div className="my-4 flex flex-wrap items-center gap-4 text-sm">
      <span>{t("collection.saleOnly")}</span>
      <Link
        to={`${pathname}${cleared.size ? `?${cleared}` : ""}`}
        variant="underline"
      >
        {t("collection.clearSaleFilter")}
      </Link>
    </div>
  );
}
