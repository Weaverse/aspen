import { CacheLong, generateCacheControlHeader } from "@shopify/hydrogen";
import { data } from "react-router";
import { COUNTRIES } from "~/utils/const";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader() {
  return data(
    { ...COUNTRIES },
    {
      headers: { "cache-control": generateCacheControlHeader(CacheLong()) },
    },
  );
}
