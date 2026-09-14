import { useTranslation } from "@weaverse/hydrogen";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";
import { getCollectionCategory } from "~/utils/collection-categories";

export function SaleFilterStatus() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const category = getCollectionCategory(
    pathname.split("/").filter(Boolean).at(-1) ?? "",
    params.get("category"),
  );
  const saleOnly = params.get("sale") === "true";
  if (!saleOnly && !category) {
    return null;
  }
  const cleared = new URLSearchParams(params);
  cleared.delete("sale");
  cleared.delete("category");
  for (const key of [...cleared.keys()]) {
    if (/cursor|direction/i.test(key)) {
      cleared.delete(key);
    }
  }
  return (
    <div className="my-4 flex flex-wrap items-center gap-4 text-sm">
      {category && <span>{t(`navigation.categories.${category.key}`)}</span>}
      {saleOnly && <span>{t("collection.saleOnly")}</span>}
      <Link
        to={`${pathname}${cleared.size ? `?${cleared}` : ""}`}
        variant="underline"
      >
        {t("collection.clearSaleFilter")}
      </Link>
    </div>
  );
}
