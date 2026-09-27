import { useTranslation } from "@weaverse/hydrogen";
import { translateThemeText } from "../utils/translation.ts";

export function useTranslatedText() {
  const { t, merchantOverrides, translationStore } = useTranslation();
  return <T>(value: T, key: string) =>
    translateThemeText(t, value, key, {
      merchantOverrides,
      designOverrides: translationStore?.getSnapshot(),
    });
}
