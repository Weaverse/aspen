import assert from "node:assert/strict";
import test from "node:test";
import { SUPPORTED_LOCALES } from "../app/utils/const.ts";
import {
  getCanonicalLocaleRedirect,
  includeDefaultLocale,
  prefixPathWithLocale,
  selectSupportedLiveLocales,
  stripLocalePrefix,
  switchLocalePath,
} from "../app/utils/locale.ts";
import {
  skipPageRevalidationForStorefrontActions,
  skipRootRevalidationForStorefrontActions,
} from "../app/utils/revalidation.ts";

const enUS = { language: "EN", country: "US" } as const;
const frFR = { language: "FR", country: "FR" } as const;
const esES = {
  label: "España · Español · EUR",
  language: "ES",
  country: "ES",
  currency: "EUR",
  pathPrefix: "/es-es",
  countryName: "España",
  languageName: "Español",
} as const;

test("advertises only locales with complete translation catalogs", () => {
  assert.deepEqual(
    SUPPORTED_LOCALES.map(({ language, country, currency, pathPrefix }) => ({
      language,
      country,
      currency,
      pathPrefix,
    })),
    [
      { language: "EN", country: "US", currency: "USD", pathPrefix: "" },
      {
        language: "FR",
        country: "FR",
        currency: "EUR",
        pathPrefix: "/fr-fr",
      },
      {
        language: "ES",
        country: "ES",
        currency: "EUR",
        pathPrefix: "/es-es",
      },
    ],
  );
});

test("filters live Shopify locales that have no complete UI catalog", () => {
  const liveLocales = [
    ...SUPPORTED_LOCALES,
    {
      ...SUPPORTED_LOCALES[0],
      country: "FR" as const,
      pathPrefix: "/en-fr",
    },
    esES,
  ];

  assert.deepEqual(
    selectSupportedLiveLocales(liveLocales, SUPPORTED_LOCALES).map(
      ({ language, country, currency, pathPrefix }) => ({
        language,
        country,
        currency,
        pathPrefix,
      }),
    ),
    [
      { language: "EN", country: "US", currency: "USD", pathPrefix: "" },
      {
        language: "FR",
        country: "FR",
        currency: "EUR",
        pathPrefix: "/fr-fr",
      },
      {
        language: "ES",
        country: "ES",
        currency: "EUR",
        pathPrefix: "/es-es",
      },
    ],
  );
});

test("keeps en-us selectable when Shopify omits the default country", () => {
  assert.deepEqual(
    includeDefaultLocale([esES], SUPPORTED_LOCALES[0]).map(
      ({ language, country, pathPrefix }) => ({
        language,
        country,
        pathPrefix,
      }),
    ),
    [
      { language: "EN", country: "US", pathPrefix: "" },
      { language: "ES", country: "ES", pathPrefix: "/es-es" },
    ],
  );
});

test("keeps the default locale unprefixed and prefixes other locales once", () => {
  assert.equal(
    prefixPathWithLocale("/products/chair", enUS),
    "/products/chair",
  );
  assert.equal(
    prefixPathWithLocale("/products/chair", frFR),
    "/fr-fr/products/chair",
  );
  assert.equal(
    prefixPathWithLocale("/fr-fr/products/chair", frFR),
    "/fr-fr/products/chair",
  );
});

test("locale-aware account and blog links preserve a non-default locale", () => {
  assert.equal(
    prefixPathWithLocale("/collections", frFR),
    "/fr-fr/collections",
  );
  assert.equal(
    prefixPathWithLocale("/account/orders/order-token", frFR),
    "/fr-fr/account/orders/order-token",
  );
  assert.equal(prefixPathWithLocale("/blogs", frFR), "/fr-fr/blogs");
});

test("does not prefix external, hash, or query-only destinations", () => {
  assert.equal(
    prefixPathWithLocale("https://example.com", enUS),
    "https://example.com",
  );
  assert.equal(prefixPathWithLocale("#reviews", enUS), "#reviews");
  assert.equal(prefixPathWithLocale("?sort=newest", enUS), "?sort=newest");
});

test("switching locale preserves path, query, and hash", () => {
  assert.equal(
    switchLocalePath({
      pathname: "/en-us/products/chair",
      search: "?color=black",
      hash: "#reviews",
      locale: frFR,
    }),
    "/fr-fr/products/chair?color=black#reviews",
  );
  assert.equal(
    switchLocalePath({
      pathname: "/fr-fr/products/chair",
      search: "?color=black",
      hash: "#reviews",
      locale: enUS,
    }),
    "/products/chair?color=black#reviews",
  );
  assert.equal(switchLocalePath({ pathname: "/fr-fr", locale: enUS }), "/");
});

test("strips only a valid leading language-country segment", () => {
  assert.equal(stripLocalePrefix("/en-us/collections/all"), "/collections/all");
  assert.equal(
    stripLocalePrefix("/collections/en-us-style"),
    "/collections/en-us-style",
  );
});

test("canonical locale redirect removes the default locale prefix", () => {
  const locale = {
    ...enUS,
    currency: "USD",
    label: "United States · English · USD",
    pathPrefix: "",
  } as const;
  const localization = {
    availableLocales: [locale],
    defaultLocale: locale,
    selectedLocale: locale,
  };

  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/products/chair?color=black"),
      localization,
    ),
    null,
  );
  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/en-us/products/chair?color=black"),
      localization,
    ),
    "/products/chair?color=black",
  );
  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/en-us"),
      localization,
    ),
    "/",
  );
  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/fr-fr/products/chair"),
      localization,
    ),
    null,
  );
  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/__manifest?paths=%2Fen-us"),
      localization,
    ),
    null,
  );
  assert.equal(
    getCanonicalLocaleRedirect(
      new Request("https://example.com/en-us.data?_routes=root"),
      localization,
    ),
    null,
  );
});

test("locale switches revalidate both root and page data after cart action", () => {
  const args = {
    currentUrl: new URL("https://example.com/products/chair"),
    nextUrl: new URL("https://example.com/fr-fr/products/chair"),
    defaultShouldRevalidate: false,
    formAction: "/cart",
    formMethod: "POST",
  } as Parameters<typeof skipRootRevalidationForStorefrontActions>[0];

  assert.equal(skipRootRevalidationForStorefrontActions(args), true);
  assert.equal(skipPageRevalidationForStorefrontActions(args), true);
});

test("same-locale cart actions still skip unnecessary revalidation", () => {
  const args = {
    currentUrl: new URL("https://example.com/products/chair"),
    nextUrl: new URL("https://example.com/products/chair"),
    defaultShouldRevalidate: true,
    formAction: "/cart",
    formMethod: "POST",
  } as Parameters<typeof skipRootRevalidationForStorefrontActions>[0];

  assert.equal(skipRootRevalidationForStorefrontActions(args), false);
  assert.equal(skipPageRevalidationForStorefrontActions(args), false);
});
