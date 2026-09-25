import assert from "node:assert/strict";
import test from "node:test";
import {
  ASPEN_2026_DESIGN_TOKENS,
  getDesignSystemPreset,
  resolveDesignTokens,
} from "~/weaverse/design-presets";

test("Aspen 2026 remains the default preset", () => {
  assert.equal(getDesignSystemPreset(undefined), "aspen-2026");
  assert.equal(getDesignSystemPreset("unknown"), "aspen-2026");
  assert.equal(getDesignSystemPreset("aspen-legacy"), "aspen-2026");
  assert.deepEqual(resolveDesignTokens(), ASPEN_2026_DESIGN_TOKENS);
});

test("Aspen 2026 restores the previous button and product card visuals", () => {
  const tokens = resolveDesignTokens({ designSystemPreset: "aspen-2026" });

  assert.equal(tokens.buttonSecondaryColor, "#24211E");
  assert.equal(tokens.buttonOutlineBackground, "#FFFFFF");
  assert.equal(tokens.buttonOutlineTextHover, "#524B46");
  assert.equal(tokens.buttonOutlineBorderHover, "#B0ACA9");
  assert.equal(tokens.newBadgeColor, "#EBE8E5");
  assert.equal(tokens.pcardHoverBackgroundColor, "#F1F1F1");
  assert.equal(tokens.pcardBorderRadius, 8);
});

test("Aspen 2026 restores responsive footer control colors", () => {
  const tokens = resolveDesignTokens({ designSystemPreset: "aspen-2026" });

  assert.equal(tokens.footerDividerColor, "#9D9D9D");
  assert.equal(tokens.footerDividerColorDesktop, "#3E3E3E");
  assert.equal(tokens.footerInputBackground, "#FFFFFF");
  assert.equal(tokens.footerInputBackgroundDesktop, "transparent");
  assert.equal(tokens.footerNewsletterButtonBackground, "#524B46");
  assert.equal(tokens.footerNewsletterButtonBackgroundDesktop, "#EDEDED");
  assert.equal(tokens.footerNewsletterButtonBackgroundHover, "#FFFFFF");
  assert.equal(tokens.footerNewsletterButtonTextColorHover, "#000000");
});

test("custom preset keeps merchant token overrides", () => {
  const tokens = resolveDesignTokens({
    designSystemPreset: "custom",
    buttonPrimaryBg: "#123456",
    footerInputBackgroundDesktop: "#654321",
    navHeightMobile: 7,
  });

  assert.equal(tokens.buttonPrimaryBg, "#123456");
  assert.equal(tokens.footerInputBackgroundDesktop, "#654321");
  assert.equal(tokens.navHeightMobile, 7);
  assert.equal(tokens.colorText, ASPEN_2026_DESIGN_TOKENS.colorText);
});

test("unset custom footer tokens preserve the existing global button colors", () => {
  const tokens = resolveDesignTokens({
    designSystemPreset: "custom",
    buttonPrimaryBg: "#123456",
    buttonPrimaryColor: "#FFFFFF",
    buttonSecondaryBg: "#654321",
    buttonSecondaryColor: "#000000",
    footerNewsletterButtonBackground: "",
    footerNewsletterButtonTextColor: "",
    footerNewsletterButtonBackgroundHover: "",
    footerNewsletterButtonTextColorHover: "",
  });

  assert.equal(tokens.footerNewsletterButtonBackground, "#123456");
  assert.equal(tokens.footerNewsletterButtonTextColor, "#FFFFFF");
  assert.equal(tokens.footerNewsletterButtonBackgroundDesktop, "#123456");
  assert.equal(tokens.footerNewsletterButtonBackgroundHover, "#654321");
  assert.equal(tokens.footerNewsletterButtonTextColorHover, "#000000");
});

test("custom product card hover keeps the legacy subtle-color fallback", () => {
  const tokens = resolveDesignTokens({
    designSystemPreset: "custom",
    colorBackgroundSubtle: "#ABCDEF",
    pcardHoverBackgroundColor: "",
    pcardBorderRadius: 18,
  });

  assert.equal(tokens.pcardHoverBackgroundColor, "#ABCDEF");
  assert.equal(tokens.pcardBorderRadius, 18);
});

test("an explicit custom product card hover color wins over the fallback", () => {
  const tokens = resolveDesignTokens({
    designSystemPreset: "custom",
    colorBackgroundSubtle: "#ABCDEF",
    pcardHoverBackgroundColor: "#123456",
  });

  assert.equal(tokens.pcardHoverBackgroundColor, "#123456");
});
