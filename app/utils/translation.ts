import enUS from "~/locales/en-us.json";

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

function nestedString(
  source: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  let value: unknown = source;
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

export function defaultTranslation(key: string): string | undefined {
  return nestedString(enUS, key);
}

type TranslationOverrides = {
  merchantOverrides?: Record<string, unknown> | null;
  designOverrides?: Record<string, string> | null;
};

function hasTranslationOverride(
  key: string,
  { merchantOverrides, designOverrides }: TranslationOverrides,
) {
  return Boolean(
    (designOverrides && Object.hasOwn(designOverrides, key)) ||
      nestedString(merchantOverrides, key) !== undefined,
  );
}

// Section content belongs to each instance. A shared field translation must
// never replace a different preset or content entered in the page editor.
// Global theme settings retain their explicit translation overrides.
export function translateThemeText<T>(
  t: Translate,
  value: T,
  key: string,
  { merchantOverrides, designOverrides }: TranslationOverrides = {},
): T | string {
  // An absent optional prop or a React node is not a translatable text field.
  if (typeof value !== "string") {
    return value;
  }

  // Page content belongs to each section instance. A shared translation key
  // must not replace an Aspen preset or merchant-authored value.
  if (key.startsWith("themeContent.")) {
    return value === defaultTranslation(key)
      ? t(key)
      : translatePresetText(t, value);
  }
  if (hasTranslationOverride(key, { merchantOverrides, designOverrides })) {
    return t(key);
  }
  if (value === defaultTranslation(key)) {
    return t(key);
  }
  return translatePresetText(t, value);
}

// Global theme settings have one value for the whole storefront. A live or
// published Translation Manager edit is therefore newer intent than the
// persisted setting, even when that setting contains custom source copy.
export function translateGlobalThemeText<T>(
  t: Translate,
  value: T,
  key: string,
  overrides: TranslationOverrides = {},
): T | string {
  if (typeof value === "string" && hasTranslationOverride(key, overrides)) {
    return t(key);
  }
  return translateThemeText(t, value, key);
}
