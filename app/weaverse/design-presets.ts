export type DesignSystemPreset = "aspen-2026" | "aspen-legacy" | "custom";

export type DesignTokenSettings = Partial<DesignTokens> & {
  designSystemPreset?: string;
};

export type DesignTokens = {
  pageWidth: number;
  navHeightMobile: number;
  navHeightTablet: number;
  navHeightDesktop: number;
  colorBackground: string;
  colorBackgroundSubtle: string;
  colorBackgroundSubtle2: string;
  colorText: string;
  colorTextSubtle: string;
  colorTextLight: string;
  colorTextInverse: string;
  colorLine: string;
  colorLineSubtle: string;
  topbarTextColor: string;
  topbarBgColor: string;
  headerBgColor: string;
  headerBgColorHover: string;
  headerText: string;
  transparentHeaderText: string;
  footerBgColor: string;
  footerText: string;
  buttonPrimaryBg: string;
  buttonPrimaryColor: string;
  buttonPrimaryBgHover: string;
  buttonPrimaryColorHover: string;
  buttonSecondaryBg: string;
  buttonSecondaryColor: string;
  buttonSecondaryBgHover: string;
  buttonSecondaryColorHover: string;
  buttonOutlineText: string;
  buttonOutlineBackground: string;
  buttonOutlineBorder: string;
  buttonOutlineTextHover: string;
  buttonOutlineBackgroundHover: string;
  buttonOutlineBorderHover: string;
  comparePriceTextColor: string;
  saleBadgeColor: string;
  newBadgeColor: string;
  bestSellerBadgeColor: string;
  bundleBadgeColor: string;
  soldOutBadgeColor: string;
  starRatingColor: string;
  pcardHoverBackgroundColor: string;
  pcardBorderRadius: number;
  bodyBaseSize: number;
  bodyBaseSpacing: string;
  bodyBaseLineHeight: number;
  h1BaseSize: number;
  headingBaseSpacing: string;
  headingBaseLineHeight: number;
  radiusXs: number;
  radiusSm: number;
  radiusMd: number;
  badgeBorderRadius: number;
  footerDividerColor: string;
  footerDividerColorDesktop: string;
  footerInputBackground: string;
  footerInputBackgroundDesktop: string;
  footerInputTextColor: string;
  footerInputTextColorDesktop: string;
  footerInputBorderColor: string;
  footerInputPlaceholderColor: string;
  footerNewsletterButtonBackground: string;
  footerNewsletterButtonTextColor: string;
  footerNewsletterButtonBackgroundHover: string;
  footerNewsletterButtonTextColorHover: string;
  footerNewsletterButtonBackgroundDesktop: string;
  footerNewsletterButtonTextColorDesktop: string;
};

export const ASPEN_2026_DESIGN_TOKENS: DesignTokens = {
  pageWidth: 1440,
  navHeightMobile: 3,
  navHeightTablet: 4,
  navHeightDesktop: 6,
  colorBackground: "#FFFFFF",
  colorBackgroundSubtle: "#EDEDED",
  colorBackgroundSubtle2: "#DFDFDF",
  colorText: "#343231",
  colorTextSubtle: "#524B46",
  colorTextLight: "#979797",
  colorTextInverse: "#FEF4EB",
  colorLine: "#9D9D9D",
  colorLineSubtle: "#D8D8D8",
  topbarTextColor: "#EDEDED",
  topbarBgColor: "#565656",
  headerBgColor: "#FFFFFF",
  headerBgColorHover: "#DFDFDF",
  headerText: "#343231",
  transparentHeaderText: "#FEF4EB",
  footerBgColor: "#1B1B19",
  footerText: "#EDEDED",
  buttonPrimaryBg: "#4D4946",
  buttonPrimaryColor: "#F1EEEA",
  buttonPrimaryBgHover: "#6D6966",
  buttonPrimaryColorHover: "#F1EEEA",
  buttonSecondaryBg: "#F0EFED",
  buttonSecondaryColor: "#343231",
  buttonSecondaryBgHover: "#E9E7E4",
  buttonSecondaryColorHover: "#343231",
  buttonOutlineText: "#343231",
  buttonOutlineBackground: "transparent",
  buttonOutlineBorder: "#B1B0AF",
  buttonOutlineTextHover: "#343231",
  buttonOutlineBackgroundHover: "#E9E7E4",
  buttonOutlineBorderHover: "#B1B0AF",
  comparePriceTextColor: "#979797",
  saleBadgeColor: "#573B3B",
  newBadgeColor: "#E3DAD4",
  bestSellerBadgeColor: "#3B3B3B",
  bundleBadgeColor: "#3B3B3B",
  soldOutBadgeColor: "#DFDFDF",
  starRatingColor: "#343231",
  pcardHoverBackgroundColor: "#EDEDED",
  pcardBorderRadius: 12,
  bodyBaseSize: 14,
  bodyBaseSpacing: "0.01em",
  bodyBaseLineHeight: 1.6,
  h1BaseSize: 64,
  headingBaseSpacing: "-0.03em",
  headingBaseLineHeight: 1.1,
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  badgeBorderRadius: 8,
  footerDividerColor: "#3E3E3E",
  footerDividerColorDesktop: "#3E3E3E",
  footerInputBackground: "#FFFFFF",
  footerInputBackgroundDesktop: "#FFFFFF",
  footerInputTextColor: "#343231",
  footerInputTextColorDesktop: "#343231",
  footerInputBorderColor: "#9D9D9D",
  footerInputPlaceholderColor: "#918379",
  footerNewsletterButtonBackground: "#4D4946",
  footerNewsletterButtonTextColor: "#F1EEEA",
  footerNewsletterButtonBackgroundHover: "#F0EFED",
  footerNewsletterButtonTextColorHover: "#343231",
  footerNewsletterButtonBackgroundDesktop: "#4D4946",
  footerNewsletterButtonTextColorDesktop: "#F1EEEA",
};

export const ASPEN_LEGACY_DESIGN_TOKENS: DesignTokens = {
  ...ASPEN_2026_DESIGN_TOKENS,
  buttonSecondaryColor: "#24211E",
  buttonSecondaryColorHover: "#24211E",
  buttonOutlineBackground: "#FFFFFF",
  buttonOutlineTextHover: "#524B46",
  buttonOutlineBorderHover: "#B0ACA9",
  newBadgeColor: "#EBE8E5",
  pcardHoverBackgroundColor: "#F1F1F1",
  pcardBorderRadius: 8,
  footerDividerColor: "#9D9D9D",
  footerInputBackgroundDesktop: "transparent",
  footerInputTextColorDesktop: "#EDEDED",
  footerNewsletterButtonBackground: "#524B46",
  footerNewsletterButtonTextColor: "#FFFFFF",
  footerNewsletterButtonBackgroundHover: "#FFFFFF",
  footerNewsletterButtonTextColorHover: "#000000",
  footerNewsletterButtonBackgroundDesktop: "#EDEDED",
  footerNewsletterButtonTextColorDesktop: "#343231",
};

const PRESET_TOKENS = {
  "aspen-2026": ASPEN_2026_DESIGN_TOKENS,
  "aspen-legacy": ASPEN_LEGACY_DESIGN_TOKENS,
} satisfies Record<Exclude<DesignSystemPreset, "custom">, DesignTokens>;

export function getDesignSystemPreset(value: unknown): DesignSystemPreset {
  if (value === "custom" || value === "aspen-legacy") {
    return value;
  }
  return "aspen-2026";
}

export function resolveDesignTokens(
  settings: DesignTokenSettings = {},
): DesignTokens {
  const preset = getDesignSystemPreset(settings.designSystemPreset);

  if (preset !== "custom") {
    return PRESET_TOKENS[preset];
  }

  const tokens = { ...ASPEN_2026_DESIGN_TOKENS };
  for (const key of Object.keys(tokens) as Array<keyof DesignTokens>) {
    const value = settings[key];
    if (value !== undefined && value !== null && value !== "") {
      Object.assign(tokens, { [key]: value });
    }
  }

  if (!settings.footerDividerColorDesktop) {
    tokens.footerDividerColorDesktop = tokens.footerDividerColor;
  }
  if (!settings.footerInputBackgroundDesktop) {
    tokens.footerInputBackgroundDesktop = tokens.footerInputBackground;
  }
  if (!settings.footerInputTextColorDesktop) {
    tokens.footerInputTextColorDesktop = tokens.footerInputTextColor;
  }
  if (!settings.footerNewsletterButtonBackground) {
    tokens.footerNewsletterButtonBackground = tokens.buttonPrimaryBg;
  }
  if (!settings.footerNewsletterButtonTextColor) {
    tokens.footerNewsletterButtonTextColor = tokens.buttonPrimaryColor;
  }
  if (!settings.footerNewsletterButtonBackgroundDesktop) {
    tokens.footerNewsletterButtonBackgroundDesktop =
      tokens.footerNewsletterButtonBackground;
  }
  if (!settings.footerNewsletterButtonTextColorDesktop) {
    tokens.footerNewsletterButtonTextColorDesktop =
      tokens.footerNewsletterButtonTextColor;
  }
  if (!settings.footerNewsletterButtonBackgroundHover) {
    tokens.footerNewsletterButtonBackgroundHover = tokens.buttonSecondaryBg;
  }
  if (!settings.footerNewsletterButtonTextColorHover) {
    tokens.footerNewsletterButtonTextColorHover = tokens.buttonSecondaryColor;
  }
  if (!settings.pcardHoverBackgroundColor) {
    tokens.pcardHoverBackgroundColor = tokens.colorBackgroundSubtle;
  }
  return tokens;
}
