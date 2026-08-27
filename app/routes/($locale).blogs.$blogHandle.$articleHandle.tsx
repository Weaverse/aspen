import type { RouteLoaderArgs } from "@weaverse/hydrogen";
import { redirect } from "react-router";
import invariant from "tiny-invariant";
import { routeHeaders } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";

export const headers = routeHeaders;
export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader(args: RouteLoaderArgs) {
  const { params } = args;
  invariant(params.articleHandle, "Missing article handle");
  const localePrefix = params.locale ? `/${params.locale}` : "";
  return redirect(`${localePrefix}/blogs/${params.articleHandle}`, 301);
}
