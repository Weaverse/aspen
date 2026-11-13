import { data, type LoaderFunctionArgs } from "react-router";
import { CacheShort, generateCacheControlHeader } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ context }: LoaderFunctionArgs) {
  return data(context.localization.availableLocales, {
    headers: { "cache-control": generateCacheControlHeader(CacheShort()) },
  });
}
