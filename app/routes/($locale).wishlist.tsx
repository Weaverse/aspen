import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
  useLoaderData,
} from "react-router";
import { ThemivoWishlist } from "~/components/wishlist/themivo-wishlist";
import { ThemivoWishlistPageLayout } from "~/components/wishlist/themivo-wishlist-page-layout";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import { revalidateWishlistAfterMutation } from "~/utils/revalidation";
import { readThemivoAppearance } from "~/utils/themivo-appearance.server";
import {
  hydrateThemivoItems,
  readThemivoSuggestions,
} from "~/utils/themivo-products.server";
import {
  changeThemivoList,
  checkThemivoPost,
  readThemivoList,
  readThemivoWishlist,
  ThemivoError,
  themivoEnabled,
  themivoErrorKey,
} from "~/utils/themivo-wishlist.server";

export const shouldRevalidate = revalidateWishlistAfterMutation;

export async function loader({ request, context }: LoaderFunctionArgs) {
  if (!themivoEnabled(context)) {
    throw new Response(null, { status: 404 });
  }
  const params = new URL(request.url).searchParams;
  try {
    const { shopper, snapshot, rules } = await readThemivoWishlist(context);
    const lists = snapshot.lists.filter(
      (list) => list.kind !== "saved_for_later",
    );
    const requestedList = params.get("list");
    const selected =
      lists.find(({ id }) => id === requestedList) ??
      lists.find(({ isDefault }) => isDefault) ??
      lists[0];
    const result = selected
      ? await readThemivoList(context, selected.id, params.get("cursor"))
      : null;
    const items = result
      ? await hydrateThemivoItems(
          context.storefront,
          result.page.items,
          result.rules.hidePrice,
        )
      : [];
    const appearance =
      !items.length && !params.has("cursor")
        ? await readThemivoAppearance(
            context.env.PUBLIC_STORE_DOMAIN,
            new URL(request.url).origin,
            context.storefront.i18n,
          )
        : null;
    const suggestions =
      appearance?.emptyCollectionId && appearance.emptySuggestions
        ? await readThemivoSuggestions(
            context.storefront,
            appearance.emptyCollectionId,
            appearance.emptySuggestions,
            [
              ...rules.hideButton,
              ...snapshot.items.map(({ productId }) => productId),
            ],
          ).catch(() => [])
        : [];
    return {
      lists,
      selected,
      items,
      suggestions,
      nextCursor: result?.page.nextCursor,
      signedIn: Boolean(shopper?.customer),
      error: null,
    };
  } catch (error) {
    return {
      lists: [],
      selected: undefined,
      items: [],
      suggestions: [],
      nextCursor: null,
      signedIn: false,
      error: themivoErrorKey(error),
    };
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (!themivoEnabled(context)) {
    throw new Response(null, { status: 404 });
  }
  try {
    checkThemivoPost(request);
    const form = await request.formData();
    if (form.get("intent") === "accept") {
      throw new ThemivoError("bad_request", 400);
    }
    return data(await changeThemivoList(context, form), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const headers = new Headers({ "Cache-Control": "private, no-store" });
    if (error instanceof ThemivoError && error.retryAfter) {
      headers.set("Retry-After", error.retryAfter);
    }
    return data(
      { error: themivoErrorKey(error) },
      {
        status:
          error instanceof ThemivoError && error.status < 500
            ? error.status
            : 503,
        headers,
      },
    );
  }
}

export default function WishlistPage() {
  const t = useThemivoTranslation();
  const wishlist = useLoaderData<typeof loader>();
  return (
    <ThemivoWishlistPageLayout title={t("wishlist.title")}>
      <ThemivoWishlist wishlist={wishlist} presentation="page" />
    </ThemivoWishlistPageLayout>
  );
}
