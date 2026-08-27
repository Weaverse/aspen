import type { I18nLocale, StoreLocalization } from "~/types/locale";

const LOCALE_SEGMENT = /^[a-z]{2}-[a-z]{2}$/i;
const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i;
const DEFAULT_LOCALE_CODE = "en-us";

export function localeCode(locale: Pick<I18nLocale, "language" | "country">) {
  return `${locale.language}-${locale.country}`.toLowerCase();
}

export function localePathPrefix(
  locale: Pick<I18nLocale, "language" | "country">,
) {
  const code = localeCode(locale);
  return code === DEFAULT_LOCALE_CODE ? "" : `/${code}`;
}

/**
 * Keep the configured locale order while discarding Shopify language-country
 * combinations that the storefront does not support. Live Shopify metadata
 * (including currency) remains authoritative in production.
 */
export function selectSupportedLiveLocales(
  liveLocales: readonly I18nLocale[],
  supportedLocales: readonly I18nLocale[],
) {
  return supportedLocales.flatMap((supportedLocale) => {
    const liveLocale = liveLocales.find(
      (candidate) => localeCode(candidate) === localeCode(supportedLocale),
    );

    return liveLocale
      ? [{ ...liveLocale, pathPrefix: supportedLocale.pathPrefix }]
      : [];
  });
}

/**
 * The root storefront locale must remain selectable even when Shopify omits
 * the active/default country from localization.availableCountries.
 */
export function includeDefaultLocale(
  locales: readonly I18nLocale[],
  defaultLocale: I18nLocale,
) {
  const defaultCode = localeCode(defaultLocale);
  const liveDefault = locales.find(
    (locale) => localeCode(locale) === defaultCode,
  );

  return [
    liveDefault ?? defaultLocale,
    ...locales.filter((locale) => localeCode(locale) !== defaultCode),
  ];
}

export function getLocaleSegment(pathname: string) {
  const segment = (pathname.split("/").filter(Boolean)[0] ?? "").replace(
    /\.data$/i,
    "",
  );
  return LOCALE_SEGMENT.test(segment) ? segment.toLowerCase() : null;
}

export function stripLocalePrefix(pathname: string) {
  const segment = getLocaleSegment(pathname);
  if (!segment) {
    return pathname || "/";
  }

  const rawSegment = pathname.split("/").filter(Boolean)[0] ?? segment;
  const withoutLocale = pathname.slice(rawSegment.length + 1);
  return withoutLocale || "/";
}

export function switchLocalePath({
  pathname,
  search = "",
  hash = "",
  locale,
}: {
  pathname: string;
  search?: string;
  hash?: string;
  locale: Pick<I18nLocale, "language" | "country">;
}) {
  const path = stripLocalePrefix(pathname);
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const localizedPath = `${localePathPrefix(locale)}${suffix}` || "/";
  return `${localizedPath}${search}${hash}`;
}

export function prefixPathWithLocale(
  to: string,
  locale: Pick<I18nLocale, "language" | "country">,
) {
  if (
    !to ||
    to.startsWith("#") ||
    to.startsWith("?") ||
    to.startsWith("//") ||
    ABSOLUTE_URL.test(to)
  ) {
    return to;
  }

  const [pathAndSearch, hash = ""] = to.split("#", 2);
  const [pathname, search = ""] = pathAndSearch.split("?", 2);
  const localeSegment = getLocaleSegment(pathname);

  if (localeSegment) {
    return to;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefix = localePathPrefix(locale);
  const localizedPath =
    `${prefix}${normalizedPath === "/" && prefix ? "" : normalizedPath}` || "/";

  return `${localizedPath}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

export function intlLocale(locale: Pick<I18nLocale, "language" | "country">) {
  return `${locale.language.toLowerCase()}-${locale.country.toUpperCase()}`;
}

export function formatDate(
  value: Date | string | number,
  locale: Pick<I18nLocale, "language" | "country">,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
) {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(
    value instanceof Date ? value : new Date(value),
  );
}

export function formatNumber(
  value: number,
  locale: Pick<I18nLocale, "language" | "country">,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

export function formatCurrency(
  value: number,
  locale: Pick<I18nLocale, "language" | "country" | "currency">,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
) {
  return formatNumber(value, locale, {
    ...options,
    style: "currency",
    currency: locale.currency,
  });
}

export function getCanonicalLocaleRedirect(
  request: Request,
  localization: StoreLocalization,
) {
  if (!(request.method === "GET" || request.method === "HEAD")) {
    return null;
  }

  const url = new URL(request.url);
  if (
    url.pathname.endsWith(".data") ||
    STATIC_PATHS.some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    )
  ) {
    return null;
  }

  const requestedLocale = getLocaleSegment(url.pathname);
  if (
    requestedLocale !== localeCode(localization.defaultLocale) ||
    localization.defaultLocale.pathPrefix
  ) {
    return null;
  }

  return `${stripLocalePrefix(url.pathname)}${url.search}`;
}

const STATIC_PATHS = [
  "/__manifest",
  "/assets",
  "/favicon.ico",
  "/robots.txt",
  "/.well-known",
  "/cdn-cgi",
];
