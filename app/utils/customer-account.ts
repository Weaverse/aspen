import type { I18nLocale as Locale } from "~/types/locale";
import { prefixPathWithLocale as localizePath } from "~/utils/locale";

/**
 * Customer Account URLs shared by the server and the browser.
 *
 * Hydrogen's Customer Account handlers own `/account/login`,
 * `/account/authorize`, `/account/refresh` and `/account/logout`. Those paths
 * are fixed and never carry a market prefix, so the market travels in the
 * query string instead. Link to them with a plain `<a>`/`<form>`, never the
 * router's `<Link>`/`<Form>`: the handlers answer with a raw redirect that
 * client-side routing cannot follow.
 */

/** Aspen's endpoint for the header account web component's token. */
export const CUSTOMER_ACCESS_TOKEN_PATH = "/api/account/token";

/**
 * The `locale` Shopify's login page renders in, built the way classic
 * Hydrogen built it from the request language: `de`, `zh-CN`, `pt-BR`.
 */
function loginPageLocale(locale: Locale): string {
  const [language, region] = locale.language.toLowerCase().split("_");
  return region ? `${language}-${region.toUpperCase()}` : language;
}

/**
 * The sign-in URL that brings the shopper back to `returnTo` in `locale`'s
 * market, with Shopify's login page in the market's language.
 *
 * `returnTo` is a same-origin path; it is localized here, so a market-neutral
 * path (`/account`) and an already-prefixed one (`/fr-fr/account`) both work.
 */
export function customerAccountLoginPath(
  returnTo: string,
  locale: Locale,
): string {
  const query = new URLSearchParams({
    return_to: localizePath(returnTo, locale),
    locale: loginPageLocale(locale),
  });
  return `/account/login?${query.toString()}`;
}
