import { CacheShort, generateCacheControlHeader } from "@shopify/hydrogen";
import { data, type LoaderFunctionArgs } from "react-router";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ context }: LoaderFunctionArgs) {
  return data(context.localization.availableLocales, {
    headers: { "cache-control": generateCacheControlHeader(CacheShort()) },
  });
}
