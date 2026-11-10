import { useTranslation } from "@weaverse/hydrogen";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import Link from "~/components/link";
import { ThemivoWishlistItems } from "~/components/wishlist/themivo-wishlist-items";
import { ThemivoWishlistPageLayout } from "~/components/wishlist/themivo-wishlist-page-layout";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { hydrateThemivoItems } from "~/utils/themivo-products.server";
import {
  readThemivoShared,
  themivoEnabled,
  themivoErrorKey,
} from "~/utils/themivo-wishlist.server";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  if (!themivoEnabled(context) || !params.token) {
    throw new Response(null, { status: 404 });
  }
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const { name, page, rules } = await readThemivoShared(
      context,
      params.token,
      cursor,
    );
    const items = await hydrateThemivoItems(
      context.storefront,
      page.items,
      rules.hidePrice,
    );
    return { name, items, nextCursor: page.nextCursor, error: null };
  } catch (error) {
    return {
      name: null,
      items: [],
      nextCursor: null,
      error: themivoErrorKey(error),
    };
  }
}

export default function SharedWishlistPage() {
  const { t } = useTranslation();
  const { name, items, nextCursor, error } = useLoaderData<typeof loader>();
  const path = usePrefixPathWithLocale("/wishlist");
  return (
    <ThemivoWishlistPageLayout title={name ?? t("wishlist.shared")}>
      <Link to={path}>{t("wishlist.title")}</Link>
      {error ? (
        <p role="alert">{t(error)}</p>
      ) : (
        <ThemivoWishlistItems items={items} rowStyle="page" />
      )}
      {nextCursor && (
        <Link to={`?cursor=${encodeURIComponent(nextCursor)}`}>
          {t("wishlist.next")}
        </Link>
      )}
    </ThemivoWishlistPageLayout>
  );
}
