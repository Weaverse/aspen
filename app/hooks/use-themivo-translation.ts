import { useTranslation } from "@weaverse/hydrogen";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { THEMIVO_TRANSLATION_KEYS } from "~/utils/themivo-translations";

export function useThemivoTranslation() {
  const { t } = useTranslation();
  const appearance = useRouteLoaderData<RootLoader>("root")?.themivoAppearance;
  return (
    key: string,
    values?: Record<string, string | number>,
    fallback = key,
  ) => {
    const vendorKey =
      THEMIVO_TRANSLATION_KEYS[key as keyof typeof THEMIVO_TRANSLATION_KEYS];
    const template = vendorKey && appearance?.translations[vendorKey];
    return template
      ? template.replace(/\{(\w+)\}/g, (match, name) =>
          String(values?.[name] ?? match),
        )
      : t(fallback, values);
  };
}
