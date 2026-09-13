import { getSeoMeta, type SeoConfig } from "@shopify/hydrogen";
import type { MetaDescriptor } from "react-router";
import enUS from "../locales/en-us.json";

type Match = { data?: unknown };

export function getMetaTranslator(matches: Match[]) {
  const root = matches.find(
    (match) => (match.data as { weaverseTheme?: unknown })?.weaverseTheme,
  )?.data as
    | {
        weaverseTheme?: {
          staticContent?: Record<string, unknown>;
          merchantOverrides?: Record<string, unknown>;
        };
      }
    | undefined;
  const theme = root?.weaverseTheme;
  const lookup = (object: unknown, key: string) =>
    key
      .split(".")
      .reduce<unknown>(
        (value, part) =>
          value && typeof value === "object" && Object.hasOwn(value, part)
            ? (value as Record<string, unknown>)[part]
            : undefined,
        object,
      );
  return (key: string, variables: Record<string, string> = {}) => {
    const value =
      lookup(theme?.merchantOverrides, key) ??
      lookup(theme?.staticContent ?? enUS, key);
    return typeof value === "string"
      ? value.replace(
          /\{\{(\w+)\}\}/g,
          (token, name: string) => variables[name] ?? token,
        )
      : key;
  };
}

// Only explicit seo.* markers authored by the theme are translated. Merchant
// product/article titles and descriptions pass through unchanged.
export function localizedSeoMeta(matches: Match[], ...configs: SeoConfig[]) {
  const t = getMetaTranslator(matches);
  const resolve = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith("seo.")) {
      return t(value);
    }
    if (Array.isArray(value)) {
      return value.map(resolve);
    }
    if (
      value &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, resolve(child)]),
      );
    }
    return value;
  };
  return getSeoMeta(...configs.map((config) => resolve(config) as SeoConfig));
}

export function localizedSeoMetaFromMatches(matches: Match[]) {
  return localizedSeoMeta(
    matches,
    ...matches
      .map((match) => (match.data as { seo?: SeoConfig } | undefined)?.seo)
      .filter((seo): seo is SeoConfig => Boolean(seo)),
  );
}

function isCanonical(descriptor: MetaDescriptor) {
  return (
    "rel" in descriptor &&
    descriptor.rel === "canonical" &&
    "tagName" in descriptor &&
    descriptor.tagName === "link"
  );
}

/** Keep the market-aware root canonical when Weaverse also provides one. */
export function withWeaverseSeo(
  routeSeo: MetaDescriptor[],
  weaverseSeo: MetaDescriptor[],
) {
  if (!routeSeo.some(isCanonical)) {
    return [...routeSeo, ...weaverseSeo];
  }
  return [...routeSeo, ...weaverseSeo.filter((tag) => !isCanonical(tag))];
}
