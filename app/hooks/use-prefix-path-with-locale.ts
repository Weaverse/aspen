import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { DEFAULT_LOCALE } from "~/utils/const";
import { prefixPathWithLocale } from "~/utils/locale";

export function usePrefixPathWithLocale(path: string) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const locale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  return prefixPathWithLocale(path, locale);
}
