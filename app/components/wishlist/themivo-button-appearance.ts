import type { CSSProperties } from "react";
import type { RootLoader } from "~/root";

type Appearance = Awaited<ReturnType<RootLoader>>["themivoAppearance"];

const BUTTON_SIZE = { sm: 32, md: 40, lg: 48 };

export function themivoButtonAppearance(
  appearance: Appearance | undefined,
  { iconOnly, fullWidth = false }: { iconOnly: boolean; fullWidth?: boolean },
): CSSProperties | undefined {
  if (!appearance) {
    return;
  }

  const { accent, buttonPreset, buttonRadius, buttonSize } = appearance;
  const size = buttonSize ? BUTTON_SIZE[buttonSize] : undefined;
  const style: CSSProperties = {
    borderRadius: buttonRadius ?? undefined,
    width: fullWidth ? "100%" : iconOnly ? size : "auto",
    height: size,
  };
  if (!accent || !buttonPreset) {
    return style;
  }
  if (buttonPreset === "bold") {
    const [red, green, blue] = [1, 3, 5].map(
      (offset) => Number.parseInt(accent.slice(offset, offset + 2), 16) / 255,
    );
    const [r, g, b] = [red, green, blue].map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return {
      ...style,
      backgroundColor: accent,
      borderColor: accent,
      color: luminance > 0.179 ? "#000" : "#fff",
    };
  }

  return {
    ...style,
    color: accent,
    backgroundColor:
      buttonPreset === "soft"
        ? `color-mix(in srgb, ${accent} 12%, var(--color-background))`
        : "var(--color-background)",
    borderColor: buttonPreset === "soft" ? "transparent" : accent,
  };
}
