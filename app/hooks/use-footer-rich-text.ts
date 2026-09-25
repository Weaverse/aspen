import { useTranslation } from "@weaverse/hydrogen";
import { useMemo } from "react";
import { sanitizeLiveFooterHtml } from "~/utils/footer-rich-text";
import { translateGlobalThemeText } from "~/utils/translation";

type FooterRichTextKey =
  | "themeContent.componentsLayoutFooter.bio"
  | "themeContent.componentsLayoutFooter.copyright";

/** Resolve Footer HTML while keeping the heavy sanitizer server-only. */
export function useFooterRichText(value: string, key: FooterRichTextKey) {
  const { t, merchantOverrides, translationStore } = useTranslation();
  const designOverrides = translationStore?.getSnapshot();
  const hasLiveOverride = Boolean(
    designOverrides && Object.hasOwn(designOverrides, key),
  );
  const translated = translateGlobalThemeText(t, value, key, {
    merchantOverrides,
    designOverrides,
  });

  return useMemo(
    () =>
      hasLiveOverride ? sanitizeLiveFooterHtml(String(translated)) : translated,
    [hasLiveOverride, translated],
  );
}
