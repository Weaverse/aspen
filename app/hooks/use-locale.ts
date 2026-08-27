import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { DEFAULT_LOCALE } from "~/utils/const";

export function useLocale() {
  return (
    useRouteLoaderData<RootLoader>("root")?.selectedLocale ?? DEFAULT_LOCALE
  );
}
