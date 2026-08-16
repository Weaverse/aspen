import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "react-router";
import type { WishlistApiResponse } from "~/types/wishlist";
import {
  MAX_WISHLIST_SIZE,
  readWishlist,
  updateWishlistProductIds,
  WISHLIST_PRODUCT_ID_PATTERN,
  writeWishlist,
} from "~/utils/wishlist.server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function loader({ context }: LoaderFunctionArgs) {
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
  const { customerAccount } = context;

  if (request.method !== "POST") {
    return wishlistResponse(
      {
        authenticated: await customerAccount.isLoggedIn(),
        productIds: [],
        error: "Method not allowed.",
      },
      405,
    );
  }

  if (!(await customerAccount.isLoggedIn())) {
    return wishlistResponse({ authenticated: false, productIds: [] }, 401);
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
        authenticated: true,
        productIds: [],
        error: "Invalid wishlist request.",
      },
      400,
    );
  }

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
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
            error: `Wishlist supports up to ${MAX_WISHLIST_SIZE} products.`,
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

      if (result.conflict && attempt === 0) {
        continue;
      }

      return wishlistResponse(
        {
          authenticated: true,
          productIds: wishlist.productIds,
          error: result.message,
          setupRequired: result.setupRequired,
        },
        result.conflict ? 409 : 400,
      );
    }
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

  return wishlistResponse(
    {
      authenticated: true,
      productIds: [],
      error: "Wishlist could not be updated. Please try again.",
    },
    409,
  );
}

function wishlistResponse(body: WishlistApiResponse, status = 200) {
  return data(body, { status, headers: NO_STORE_HEADERS });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Wishlist is temporarily unavailable.";
}
