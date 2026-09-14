import enUS from "../locales/en-us.json";

// Presets supply different copy to the same shared component. Match only known
// theme-owned English values; arbitrary merchant content stays untouched.
const presetKeys = new Map(
  Object.entries(enUS.themePresets).flatMap(([group, values]) =>
    Object.entries(values).map(
      ([field, value]) => [value, `themePresets.${group}.${field}`] as const,
    ),
  ),
);

export function translatePresetText<T>(t: Translate, value: T): T | string {
  const key = typeof value === "string" ? presetKeys.get(value) : undefined;
  return key ? t(key) : value;
}

export type Translate = (
  key: string,
  variables?: Record<string, string | number>,
) => string;

export function defaultTranslation(key: string): string | undefined {
  let value: unknown = enUS;
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

// Section content belongs to each instance. A shared field translation must
// never replace a different preset or content entered in the page editor.
// Global theme settings retain their explicit translation overrides.
export function translateThemeText<T>(
  t: Translate,
  value: T,
  key: string,
  {
    merchantOverrides,
    designOverrides,
  }: {
    merchantOverrides?: Record<string, unknown> | null;
    designOverrides?: Record<string, string> | null;
  } = {},
): T | string {
  // An absent optional prop or a React node is not a translatable text field.
  if (typeof value !== "string") {
    return value;
  }
  if (key.startsWith("themeContent.")) {
    return value === defaultTranslation(key)
      ? t(key)
      : translatePresetText(t, value);
  }
  let published: unknown = merchantOverrides;
  for (const part of key.split(".")) {
    published =
      published &&
      typeof published === "object" &&
      Object.hasOwn(published, part)
        ? (published as Record<string, unknown>)[part]
        : undefined;
  }
  if (
    (designOverrides && Object.hasOwn(designOverrides, key)) ||
    typeof published === "string"
  ) {
    return t(key);
  }
  if (value === defaultTranslation(key)) {
    return t(key);
  }
  return translatePresetText(t, value);
}
