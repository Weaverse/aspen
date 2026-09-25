import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import { useMemo } from "react";
import { translateThemeText } from "~/utils/translation";

const textKeys: Record<string, string> = {
  newsletterPopupHeading: "themeSettings.newsletterPopupHeading",
  newsletterPopupDescription: "themeSettings.newsletterPopupDescription",
  newsletterPopupButtonText: "themeSettings.newsletterPopupButtonText",
  topbarText: "themeSettings.topbarText",
  bestSellerBadgeText: "themeSettings.bestSellerBadgeText",
  newBadgeText: "themeSettings.newBadgeText",
  soldOutBadgeText: "themeSettings.soldOutBadgeText",
  bundleBadgeText: "themeSettings.bundleBadgeText",
  saleBadgeText: "themeSettings.saleBadgeText",
  cartTitleEmpty: "themeSettings.cartTitleEmpty",
  buttonStartShopping: "themeSettings.buttonStartShopping",
  cartNoteButtonText: "themeSettings.cartNoteButtonText",
  discountCodeButtonText: "themeSettings.discountCodeButtonText",
  giftCardButtonText: "themeSettings.giftCardButtonText",
  checkoutButtonText: "themeSettings.checkoutButtonText",
  loyaltyProgramName: "themeSettings.loyaltyProgramName",
  quickShopButtonTextOpen: "themeSettings.quickShopButtonTextOpen",
  addToCartText: "themeSettings.addToCartText",
  soldOutText: "themeSettings.soldOutText",
  searchEditorialHeading: "themeSettings.searchEditorialHeading",
  searchEditorialLinkText: "themeSettings.searchEditorialLinkText",
  collectionEditorialHeading: "themeSettings.collectionEditorialHeading",
  collectionEditorialLinkText: "themeSettings.collectionEditorialLinkText",
};
export function useTranslatedThemeSettings() {
  const settings = useThemeSettings() ?? {};
  const { t, merchantOverrides, translationStore } = useTranslation();
  const designOverrides = translationStore?.getSnapshot();
  return useMemo(() => {
    const translated = { ...settings };
    for (const [field, key] of Object.entries(textKeys)) {
      const value = settings[field];
      if (typeof value === "string") {
        translated[field] = translateThemeText(t, value, key, {
          merchantOverrides,
          designOverrides,
        });
      }
    }
    return translated;
  }, [settings, t, merchantOverrides, designOverrides]);
}
