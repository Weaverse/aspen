import { useTranslation } from "@weaverse/hydrogen";
import { translateGlobalThemeText } from "~/utils/translation";

export function useGlobalThemeText() {
  const { t, merchantOverrides, translationStore } = useTranslation();
  return <T>(value: T, key: string) =>
    translateGlobalThemeText(t, value, key, {
      merchantOverrides,
      designOverrides: translationStore?.getSnapshot(),
    });
}
