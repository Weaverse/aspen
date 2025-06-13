import { useThemeSettings } from "@weaverse/hydrogen";

export function GlobalStyle() {
  let settings = useThemeSettings();
  if (settings) {
    let {
      colorBackground,
      colorText,
      colorTextSubtle,
      colorTextInverse,
      colorLine,
      colorLineSubtle,
      topbarTextColor,
      topbarBgColor,
      headerBgColor,
      headerText,
      transparentHeaderText,
      footerBgColor,
      footerText,
      buttonPrimaryBg,
      buttonPrimaryColor,
      buttonSecondaryBg,
      buttonSecondaryColor,
      buttonOutlineText,
      buttonOutlineBackground,
      buttonOutlineBorder,
      comparePriceTextColor,
      discountBadge,
      newBadge,
      bestSellerBadge,
      soldOutAndUnavailable,
      starRating,
      bodyBaseSize,
      bodyBaseSpacing,
      bodyBaseLineHeight,
      h1BaseSize,
      headingBaseSpacing,
      headingBaseLineHeight,
      navHeightDesktop,
      navHeightTablet,
      pageWidth,
    } = settings;

    return (
      <style
        key="global-theme-style"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Layout */
              --height-nav: ${settings.navHeightMobile}rem;
              --page-width: ${pageWidth}px;

              /* Colors (general) */
              --color-background: ${colorBackground};
              --color-text: ${colorText};
              --color-text-subtle: ${colorTextSubtle};
              --color-text-inverse: ${colorTextInverse};
              --color-line: ${colorLine};
              --color-line-subtle: ${colorLineSubtle};

              /* Colors (header & footer) */
              --color-topbar-text: ${topbarTextColor};
              --color-topbar-bg: ${topbarBgColor};
              --color-header-bg: ${headerBgColor};
              --color-header-text: ${headerText};
              --color-transparent-header-text: ${transparentHeaderText};
              --color-footer-bg: ${footerBgColor};
              --color-footer-text: ${footerText};

              /* Colors (buttons & links) */
              --btn-primary-bg: ${buttonPrimaryBg};
              --btn-primary-text: ${buttonPrimaryColor};
              --btn-secondary-bg: ${buttonSecondaryBg};
              --btn-secondary-text: ${buttonSecondaryColor};
              --btn-outline-text: ${buttonOutlineText};
              --btn-outline-background: ${buttonOutlineBackground};
              --btn-outline-border: ${buttonOutlineBorder};

              /* Colors (product) */
              --color-compare-price-text: ${comparePriceTextColor};
              --color-discount: ${discountBadge};
              --color-new-badge: ${newBadge};
              --color-best-seller: ${bestSellerBadge};
              --color-sold-out-and-unavailable: ${soldOutAndUnavailable};
              --color-star-rating: ${starRating};

              /* Typography */
              --body-base-size: ${bodyBaseSize}px;
              --body-base-spacing: ${bodyBaseSpacing};
              --body-base-line-height: ${bodyBaseLineHeight};

              --heading-scale-ratio: 1.2;
              --heading-mobile-scale-ratio: 1.1;

              --h1-base-size: ${h1BaseSize}px;
              --h2-base-size: round(calc(var(--h1-base-size) / var(--heading-scale-ratio)), 1px);
              --h3-base-size: round(calc(var(--h2-base-size) / var(--heading-scale-ratio)), 1px);
              --h4-base-size: round(calc(var(--h3-base-size) / var(--heading-scale-ratio)), 1px);
              --h5-base-size: round(calc(var(--h4-base-size) / var(--heading-scale-ratio)), 1px);
              --h6-base-size: round(calc(var(--h5-base-size) / var(--heading-scale-ratio)), 1px);

              --h1-mobile-size: round(calc(var(--h1-base-size) / var(--heading-mobile-scale-ratio)), 1px);
              --h2-mobile-size: round(calc(var(--h2-base-size) / var(--heading-mobile-scale-ratio)), 1px);
              --h3-mobile-size: round(calc(var(--h3-base-size) / var(--heading-mobile-scale-ratio)), 1px);
              --h4-mobile-size: round(calc(var(--h4-base-size) / var(--heading-mobile-scale-ratio)), 1px);
              --h5-mobile-size: round(calc(var(--h5-base-size) / var(--heading-mobile-scale-ratio)), 1px);
              --h6-mobile-size: round(calc(var(--h6-base-size) / var(--heading-mobile-scale-ratio)), 1px);

              --heading-base-spacing: ${headingBaseSpacing};
              --heading-base-line-height: ${headingBaseLineHeight};

            @media (min-width: 32em) {
              body {
                --height-nav: ${navHeightTablet}rem;
              }
            }
            @media (min-width: 48em) {
              body {
                --height-nav: ${navHeightDesktop}rem;
              }
            }
          `,
        }}
      />
    );
  }
  return null;
}
