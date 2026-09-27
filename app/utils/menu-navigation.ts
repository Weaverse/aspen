import type { I18nLocale } from "../types/locale.ts";
import type { SingleMenuItem } from "../types/menu.ts";
import { prefixPathWithLocale } from "./locale.ts";

type MenuNavigation = {
  navigateExternal: (to: string, target: string) => void;
  navigateInternal: (to: string) => void;
};

export function navigateToMenuItem(
  item: Pick<SingleMenuItem, "isExternal" | "target" | "to">,
  locale: Pick<I18nLocale, "country" | "language">,
  navigation: MenuNavigation,
) {
  if (item.isExternal) {
    navigation.navigateExternal(item.to, item.target ?? "_blank");
    return;
  }
  navigation.navigateInternal(prefixPathWithLocale(item.to, locale));
}
