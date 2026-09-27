import { useThemeSettings } from "@weaverse/hydrogen";
import {
  type DesignTokenSettings,
  getDesignSystemPreset,
  resolveDesignTokens,
} from "~/weaverse/design-presets";

/**
 * Converts the merchant-facing theme settings into the CSS design tokens used
 * throughout Aspen. Fallbacks keep older Weaverse projects compatible when a
 * newly introduced setting has not been saved to the project yet.
 */
export function GlobalStyle() {
  const settings = (useThemeSettings() ?? {}) as DesignTokenSettings;
  const designSystemPreset = getDesignSystemPreset(settings.designSystemPreset);
  const {
    pageWidth,
    navHeightMobile,
    navHeightTablet,
    navHeightDesktop,
    colorBackground,
    colorBackgroundSubtle,
    colorBackgroundSubtle2,
    colorText,
    colorTextSubtle,
    colorTextLight,
    colorTextInverse,
    colorLine,
    colorLineSubtle,
    topbarTextColor,
    topbarBgColor,
    headerBgColor,
    headerBgColorHover,
    headerText,
    transparentHeaderText,
    footerBgColor,
    footerText,
    buttonPrimaryBg,
    buttonPrimaryColor,
    buttonPrimaryBgHover,
    buttonPrimaryColorHover,
    buttonSecondaryBg,
    buttonSecondaryColor,
    buttonSecondaryBgHover,
    buttonSecondaryColorHover,
    buttonOutlineText,
    buttonOutlineBackground,
    buttonOutlineBorder,
    buttonOutlineTextHover,
    buttonOutlineBackgroundHover,
    buttonOutlineBorderHover,
    comparePriceTextColor,
    saleBadgeColor,
    newBadgeColor,
    bestSellerBadgeColor,
    bundleBadgeColor,
    soldOutBadgeColor,
    starRatingColor,
    pcardHoverBackgroundColor,
    pcardBorderRadius,
    bodyBaseSize,
    bodyBaseSpacing,
    bodyBaseLineHeight,
    h1BaseSize,
    headingBaseSpacing,
    headingBaseLineHeight,
    radiusXs,
    radiusSm,
    radiusMd,
    badgeBorderRadius,
    footerDividerColor,
    footerDividerColorDesktop,
    footerInputBackground,
    footerInputBackgroundDesktop,
    footerInputTextColor,
    footerInputTextColorDesktop,
    footerInputBorderColor,
    footerInputPlaceholderColor,
    footerNewsletterButtonBackground,
    footerNewsletterButtonTextColor,
    footerNewsletterButtonBackgroundHover,
    footerNewsletterButtonTextColorHover,
    footerNewsletterButtonBackgroundDesktop,
    footerNewsletterButtonTextColorDesktop,
  } = resolveDesignTokens(settings);

  return (
    <style
      key="global-theme-style"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            /* Layout */
            --height-nav: ${designSystemPreset === "custom" ? `${navHeightMobile}rem` : "88px"};
            --page-width: ${pageWidth}px;
            --page-padding: 20px;
            --section-padding-y: 80px;
            --section-heading-gap: 48px;

            /* Radius */
            --radius-xs: ${radiusXs}px;
            --radius-sm: ${radiusSm}px;
            --radius-md: ${radiusMd}px;
            --badge-radius: ${badgeBorderRadius}px;

            /* Colors (general) */
            --color-background: ${colorBackground};
            --color-background-subtle: ${colorBackgroundSubtle};
            --color-background-subtle-2: ${colorBackgroundSubtle2};
            --color-text: ${colorText};
            --color-text-subtle: ${colorTextSubtle};
            --color-text-light: ${colorTextLight};
            --color-text-inverse: ${colorTextInverse};
            --color-line: ${colorLine};
            --color-line-subtle: ${colorLineSubtle};

            /* Colors (header & footer) */
            --color-topbar-text: ${topbarTextColor};
            --color-topbar-bg: ${topbarBgColor};
            --color-header-bg: ${headerBgColor};
            --color-header-bg-hover: ${headerBgColorHover};
            --color-header-text: ${headerText};
            --color-transparent-header-text: ${transparentHeaderText};
            --color-footer-bg: ${footerBgColor};
            --color-footer-text: ${footerText};

            /* Colors (footer controls) */
            --footer-divider-color: ${footerDividerColor};
            --footer-input-bg: ${footerInputBackground};
            --footer-input-text: ${footerInputTextColor};
            --footer-input-border: ${footerInputBorderColor};
            --footer-input-placeholder: ${footerInputPlaceholderColor};
            --footer-newsletter-button-bg: ${footerNewsletterButtonBackground};
            --footer-newsletter-button-text: ${footerNewsletterButtonTextColor};
            --footer-newsletter-button-bg-hover: ${footerNewsletterButtonBackgroundHover};
            --footer-newsletter-button-text-hover: ${footerNewsletterButtonTextColorHover};

            /* Colors (buttons & links) */
            --btn-primary-bg: ${buttonPrimaryBg};
            --btn-primary-text: ${buttonPrimaryColor};
            --btn-primary-bg-hover: ${buttonPrimaryBgHover};
            --btn-primary-text-hover: ${buttonPrimaryColorHover};
            --btn-secondary-bg: ${buttonSecondaryBg};
            --btn-secondary-text: ${buttonSecondaryColor};
            --btn-secondary-bg-hover: ${buttonSecondaryBgHover};
            --btn-secondary-text-hover: ${buttonSecondaryColorHover};
            --btn-outline-text: ${buttonOutlineText};
            --btn-outline-background: ${buttonOutlineBackground};
            --btn-outline-border: ${buttonOutlineBorder};
            --btn-outline-text-hover: ${buttonOutlineTextHover};
            --btn-outline-background-hover: ${buttonOutlineBackgroundHover};
            --btn-outline-border-hover: ${buttonOutlineBorderHover};

            /* Colors (product) */
            --color-compare-price-text: ${comparePriceTextColor};
            --color-discount: ${saleBadgeColor};
            --color-new-badge: ${newBadgeColor};
            --color-best-seller: ${bestSellerBadgeColor};
            --color-bundle-badge: ${bundleBadgeColor};
            --color-sold-out-and-unavailable: ${soldOutBadgeColor};
            --color-star-rating: ${starRatingColor};
            --pcard-hover-background-default: ${pcardHoverBackgroundColor};
            --pcard-border-radius-default: ${pcardBorderRadius}px;

            /* Typography */
            --body-base-size: ${bodyBaseSize}px;
            --body-base-spacing: ${bodyBaseSpacing};
            --body-base-line-height: ${bodyBaseLineHeight};

            --h1-base-size: ${h1BaseSize}px;
            --h2-base-size: calc(var(--h1-base-size) * 0.828125);
            --h3-base-size: calc(var(--h1-base-size) * 0.6875);
            --h4-base-size: calc(var(--h1-base-size) * 0.578125);
            --h5-base-size: calc(var(--h1-base-size) * 0.5);
            --h6-base-size: calc(var(--h1-base-size) * 0.40625);

            --h1-mobile-size: min(var(--h1-base-size), 42px);
            --h2-mobile-size: min(var(--h2-base-size), 36px);
            --h3-mobile-size: min(var(--h3-base-size), 32px);
            --h4-mobile-size: min(var(--h4-base-size), 28px);
            --h5-mobile-size: min(var(--h5-base-size), 24px);
            --h6-mobile-size: min(var(--h6-base-size), 20px);

            --heading-base-spacing: ${headingBaseSpacing};
            --heading-base-line-height: ${headingBaseLineHeight};
          }

          body {
            --initial-topbar-height: var(--initial-topbar-height-mobile, 0px);
          }

          @media (min-width: 32em) {
            :root {
              --height-nav: ${designSystemPreset === "custom" ? `${navHeightTablet}rem` : "88px"};
              --page-padding: 32px;
              --section-padding-y: 80px;
              --section-heading-gap: 64px;
            }
          }

          @media (min-width: 1025px) {
            :root {
              --page-padding: 40px;
            }
          }

          @media (min-width: 80em) {
            :root {
              --height-nav: ${designSystemPreset === "custom" ? `${navHeightDesktop}rem` : "81px"};
              --footer-divider-color: ${footerDividerColorDesktop};
              --footer-input-bg: ${footerInputBackgroundDesktop};
              --footer-input-text: ${footerInputTextColorDesktop};
              --footer-newsletter-button-bg: ${footerNewsletterButtonBackgroundDesktop};
              --footer-newsletter-button-text: ${footerNewsletterButtonTextColorDesktop};
            }

            body {
              --initial-topbar-height: var(--initial-topbar-height-desktop, 0px);
            }
          }
        `,
      }}
    />
  );
}
