import type { ShouldRevalidateFunctionArgs } from "react-router";

const PAGE_INDEPENDENT_ACTION_PATH =
  /(?:^|\/)(?:cart|api\/wishlist|api\/back-in-stock)$/;

/**
 * Cart mutations do not change CMS or catalog page data. Revalidating those
 * loaders after a cart fetcher submission is both wasteful and unsafe in the
 * worker dev runtime, where Weaverse's dynamic module import can outlive the
 * request that created it.
 *
 * Cart mutation responses are synchronized into CartStateProvider, so the
 * global cart UI still receives Shopify's authoritative response.
 */
export function skipPageRevalidationForStorefrontActions({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
  formAction,
  formMethod,
}: ShouldRevalidateFunctionArgs) {
  if (hasLocalePathChange(currentUrl, nextUrl)) {
    return true;
  }

  if (formAction && formMethod && formMethod.toUpperCase() !== "GET") {
    const actionUrl = new URL(formAction, currentUrl);
    const actionPath = actionUrl.pathname.replace(/\.data$/, "");

    if (PAGE_INDEPENDENT_ACTION_PATH.test(actionPath)) {
      return false;
    }
  }

  return defaultShouldRevalidate;
}

/**
 * Wishlist and cart actions return authoritative state to their client-side
 * providers. Avoid reloading root CMS/theme data after either mutation.
 */
export function skipRootRevalidationForStorefrontActions({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
  formAction,
  formMethod,
}: ShouldRevalidateFunctionArgs) {
  if (hasLocalePathChange(currentUrl, nextUrl)) {
    return true;
  }

  if (formAction && formMethod && formMethod.toUpperCase() !== "GET") {
    const actionUrl = new URL(formAction, currentUrl);
    const actionPath = actionUrl.pathname.replace(/\.data$/, "");

    if (PAGE_INDEPENDENT_ACTION_PATH.test(actionPath)) {
      return false;
    }
  }

  return defaultShouldRevalidate;
}

function hasLocalePathChange(currentUrl: URL, nextUrl: URL) {
  return getLocalePathSegment(currentUrl) !== getLocalePathSegment(nextUrl);
}

function getLocalePathSegment(url: URL) {
  const firstSegment = url.pathname.split("/").filter(Boolean)[0] ?? "";
  return /^[a-z]{2}-[a-z]{2}$/i.test(firstSegment)
    ? firstSegment.toLowerCase()
    : null;
}
