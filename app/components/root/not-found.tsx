import { useTranslation } from "@weaverse/hydrogen";
import { StorefrontError } from "~/components/root/storefront-error";

export function NotFound({ type: _type = "page" }: { type?: string }) {
  const { t } = useTranslation();
  return <StorefrontError statusCode={404} title={t("system.pageNotFound")} />;
}
