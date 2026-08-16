import { useThemeSettings } from "@weaverse/hydrogen";

/**
 * Converts the merchant-facing theme settings into the CSS design tokens used
 * throughout Aspen. Fallbacks keep older Weaverse projects compatible when a
 * newly introduced setting has not been saved to the project yet.
 */
export function GlobalStyle() {
  const settings = useThemeSettings() ?? {};

  let {
    designSystemPreset = "aspen-2026",
    colorBackground = "#FFFFFF",
    colorBackgroundSubtle = "#EDEDED",
    colorBackgroundSubtle2 = "#DFDFDF",
    colorText = "#343231",
    colorTextSubtle = "#524B46",
    colorTextLight = "#979797",
    colorTextInverse = "#FEF4EB",
    colorLine = "#9D9D9D",
    colorLineSubtle = "#D8D8D8",
    topbarTextColor = "#EDEDED",
    topbarBgColor = "#565656",
    headerBgColor = "#FFFFFF",
    headerBgColorHover = "#DFDFDF",
    headerText = "#343231",
    transparentHeaderText = "#FEF4EB",
    footerBgColor = "#1B1B19",
    footerText = "#EDEDED",
    buttonPrimaryBg = "#4D4946",
    buttonPrimaryColor = "#F1EEEA",
    buttonPrimaryBgHover = "#6D6966",
    buttonPrimaryColorHover = "#F1EEEA",
    buttonSecondaryBg = "#F0EFED",
    buttonSecondaryColor = "#24211E",
    buttonSecondaryBgHover = "#E9E7E4",
    buttonSecondaryColorHover = "#24211E",
    buttonOutlineText = "#343231",
    buttonOutlineBackground = "#FFFFFF",
    buttonOutlineBorder = "#B1B0AF",
    buttonOutlineTextHover = "#524B46",
    buttonOutlineBackgroundHover = "#E9E7E4",
    buttonOutlineBorderHover = "#B0ACA9",
    comparePriceTextColor = "#979797",
    saleBadgeColor = "#573B3B",
    newBadgeColor = "#EBE8E5",
    bestSellerBadgeColor = "#3B3B3B",
    bundleBadgeColor = "#3B3B3B",
    soldOutBadgeColor = "#DFDFDF",
    starRatingColor = "#343231",
    bodyBaseSize = 14,
    bodyBaseSpacing = "-0.0125em",
    bodyBaseLineHeight = 1.5,
    h1BaseSize = 64,
    headingBaseSpacing = "-0.025em",
    headingBaseLineHeight = 1.1,
    navHeightMobile = 3,
    navHeightTablet = 4,
    navHeightDesktop = 6,
    pageWidth = 1440,
    radiusXs = 4,
    radiusSm = 8,
    radiusMd = 12,
    badgeBorderRadius = 4,
  } = settings;

  if (designSystemPreset !== "custom") {
    pageWidth = 1440;
    colorBackground = "#FFFFFF";
    colorBackgroundSubtle = "#EDEDED";
    colorBackgroundSubtle2 = "#DFDFDF";
    colorText = "#343231";
    colorTextSubtle = "#524B46";
    colorTextLight = "#979797";
    colorTextInverse = "#FEF4EB";
    colorLine = "#9D9D9D";
    colorLineSubtle = "#D8D8D8";
    topbarTextColor = "#EDEDED";
    topbarBgColor = "#565656";
    headerBgColor = "#FFFFFF";
    headerBgColorHover = "#DFDFDF";
    headerText = "#343231";
    transparentHeaderText = "#FEF4EB";
    footerBgColor = "#1B1B19";
    footerText = "#EDEDED";
    buttonPrimaryBg = "#4D4946";
    buttonPrimaryColor = "#F1EEEA";
    buttonPrimaryBgHover = "#6D6966";
    buttonPrimaryColorHover = "#F1EEEA";
    buttonSecondaryBg = "#F0EFED";
    buttonSecondaryColor = "#24211E";
    buttonSecondaryBgHover = "#E9E7E4";
    buttonSecondaryColorHover = "#24211E";
    buttonOutlineText = "#343231";
    buttonOutlineBackground = "#FFFFFF";
    buttonOutlineBorder = "#B1B0AF";
    buttonOutlineTextHover = "#524B46";
    buttonOutlineBackgroundHover = "#E9E7E4";
    buttonOutlineBorderHover = "#B0ACA9";
    comparePriceTextColor = "#979797";
    saleBadgeColor = "#573B3B";
    newBadgeColor = "#EBE8E5";
    bestSellerBadgeColor = "#3B3B3B";
    bundleBadgeColor = "#3B3B3B";
    soldOutBadgeColor = "#DFDFDF";
    badgeBorderRadius = 4;
    bodyBaseSize = 14;
    bodyBaseSpacing = "-0.0125em";
    bodyBaseLineHeight = 1.5;
    h1BaseSize = 64;
    headingBaseSpacing = "-0.025em";
    headingBaseLineHeight = 1.1;
    radiusXs = 4;
    radiusSm = 8;
    radiusMd = 12;
  }

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
            --section-padding-y: 64px;
            --section-heading-gap: 32px;

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
              --page-padding: 24px;
              --section-padding-y: 72px;
              --section-heading-gap: 48px;
            }
          }

          @media (min-width: 64em) {
            :root {
              --page-padding: 40px;
              --section-padding-y: 80px;
              --section-heading-gap: 64px;
            }
          }

          @media (min-width: 80em) {
            :root {
              --height-nav: ${designSystemPreset === "custom" ? `${navHeightDesktop}rem` : "81px"};
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
