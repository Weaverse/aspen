import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "react-router";
import type { WishlistApiResponse } from "~/types/wishlist";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { readThemivoAppearance } from "~/utils/themivo-appearance.server";
import { themivoVariantBelongsToProduct } from "~/utils/themivo-products.server";
import {
  checkThemivoPost,
  readThemivoHearts,
  readThemivoProductCount,
  ThemivoError,
  themivoEnabled,
  themivoErrorKey,
  toggleThemivoHeart,
} from "~/utils/themivo-wishlist.server";
import {
  MAX_WISHLIST_SIZE,
  readWishlist,
  updateWishlistProductIds,
  WISHLIST_PRODUCT_ID_PATTERN,
  writeWishlist,
} from "~/utils/wishlist.server";
import {
  commitPreviewWishlist,
  isWishlistPreviewRequest,
  readPreviewWishlist,
} from "~/utils/wishlist-preview.server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};
const WISHLIST_WRITE_ATTEMPTS = 2;

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export async function loader({ request, context }: LoaderFunctionArgs) {
  if (themivoEnabled(context)) {
    const url = new URL(request.url);
    const countProduct = url.searchParams.get("countProduct");
    if (countProduct !== null) {
      try {
        const appearance = await readThemivoAppearance(
          context.env.PUBLIC_STORE_DOMAIN,
          url.origin,
          context.storefront.i18n,
        );
        return data(
          {
            productId: countProduct,
            count: appearance?.productShowCount
              ? await readThemivoProductCount(context, countProduct)
              : null,
          },
          { headers: NO_STORE_HEADERS },
        );
      } catch {
        return data(
          { productId: countProduct, count: null },
          { headers: NO_STORE_HEADERS },
        );
      }
    }
    return wishlistResponse(await readThemivoHearts(context));
  }
  if (isWishlistPreviewRequest(request)) {
    return wishlistResponse({
      authenticated: true,
      productIds: await readPreviewWishlist(request),
    });
  }

  const { customerAccount } = context;

  if (!(await customerAccount.isLoggedIn())) {
    return wishlistResponse({ authenticated: false, productIds: [] });
  }

  try {
    const wishlist = await readWishlist(customerAccount);
    return wishlistResponse({
      authenticated: true,
      productIds: wishlist.productIds,
    });
  } catch (error) {
    return wishlistResponse(
      {
        authenticated: true,
        productIds: [],
        error: getErrorMessage(error),
      },
      500,
    );
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return wishlistResponse(
      {
        authenticated: await isWishlistAuthenticated(request, context),
        productIds: [],
        error: "errors.methodNotAllowed",
      },
      405,
    );
  }

  if (themivoEnabled(context)) {
    try {
      checkThemivoPost(request);
      const form = await request.formData();
      const productId = String(form.get("productId") ?? "");
      const intent = form.get("intent");
      const variantId = form.get("variantId");
      if (
        !WISHLIST_PRODUCT_ID_PATTERN.test(productId) ||
        (intent !== "add" && intent !== "remove") ||
        (variantId !== null &&
          (typeof variantId !== "string" ||
            !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variantId)))
      ) {
        throw new ThemivoError("bad_request", 400);
      }
      if (
        typeof variantId === "string" &&
        !(await themivoVariantBelongsToProduct(
          context.storefront,
          variantId,
          productId,
        ))
      ) {
        throw new ThemivoError("bad_request", 400);
      }
      return wishlistResponse(
        await toggleThemivoHeart(
          context,
          productId,
          intent,
          typeof variantId === "string" ? variantId : undefined,
        ),
      );
    } catch (error) {
      return wishlistResponse(
        {
          authenticated: false,
          acceptsGuests: true,
          loginRequired:
            error instanceof ThemivoError && error.code === "login_required",
          productIds: [],
          error: themivoErrorKey(error),
        },
        error instanceof ThemivoError && error.status < 500
          ? error.status
          : 503,
        error instanceof ThemivoError && error.retryAfter
          ? { "Retry-After": error.retryAfter }
          : undefined,
      );
    }
  }

  const formData = await request.formData();
  const productId = String(formData.get("productId") || "");
  const intent = formData.get("intent");

  if (
    !WISHLIST_PRODUCT_ID_PATTERN.test(productId) ||
    (intent !== "add" && intent !== "remove")
  ) {
    return wishlistResponse(
      {
        authenticated: await isWishlistAuthenticated(request, context),
        productIds: [],
        error: "errors.wishlistInvalidRequest",
      },
      400,
    );
  }

  if (isWishlistPreviewRequest(request)) {
    const productIds = await readPreviewWishlist(request);
    const nextIds = updateWishlistProductIds(productIds, productId, intent);

    if (nextIds.length > MAX_WISHLIST_SIZE) {
      return wishlistResponse(
        {
          authenticated: true,
          productIds,
          error: "errors.wishlistLimit",
        },
        400,
      );
    }

    return wishlistResponse({ authenticated: true, productIds: nextIds }, 200, {
      "Set-Cookie": await commitPreviewWishlist(nextIds),
    });
  }

  const { customerAccount } = context;

  if (!(await customerAccount.isLoggedIn())) {
    return wishlistResponse({ authenticated: false, productIds: [] }, 401);
  }

  try {
    let conflictProductIds: string[] = [];
    let conflictMessage = "errors.wishlistUpdate";

    for (let attempt = 0; attempt < WISHLIST_WRITE_ATTEMPTS; attempt += 1) {
      const wishlist = await readWishlist(customerAccount);
      const nextIds = updateWishlistProductIds(
        wishlist.productIds,
        productId,
        intent,
      );

      if (nextIds.length > MAX_WISHLIST_SIZE) {
        return wishlistResponse(
          {
            authenticated: true,
            productIds: wishlist.productIds,
            error: "errors.wishlistLimit",
          },
          400,
        );
      }

      const result = await writeWishlist(customerAccount, wishlist, nextIds);
      if (result.ok) {
        return wishlistResponse({
          authenticated: true,
          productIds: nextIds,
        });
      }

      if (result.conflict) {
        conflictProductIds = wishlist.productIds;
        conflictMessage = result.message;
        continue;
      }

      return wishlistResponse(
        {
          authenticated: true,
          productIds: wishlist.productIds,
          error: result.message,
          setupRequired: result.setupRequired,
        },
        400,
      );
    }

    return wishlistResponse(
      {
        authenticated: true,
        productIds: conflictProductIds,
        error: conflictMessage,
      },
      409,
    );
  } catch (error) {
    return wishlistResponse(
      {
        authenticated: true,
        productIds: [],
        error: getErrorMessage(error),
      },
      500,
    );
  }
}

async function isWishlistAuthenticated(
  request: Request,
  context: ActionFunctionArgs["context"],
) {
  return (
    isWishlistPreviewRequest(request) ||
    (await context.customerAccount.isLoggedIn())
  );
}

function wishlistResponse(
  body: WishlistApiResponse,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  return data(body, {
    status,
    headers: extraHeaders
      ? { ...NO_STORE_HEADERS, ...extraHeaders }
      : NO_STORE_HEADERS,
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "errors.wishlistUnavailable";
}
