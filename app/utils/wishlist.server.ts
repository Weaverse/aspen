import type { CustomerAccount } from "@shopify/hydrogen";
import type {
  WishlistCustomerQuery,
  WishlistUpdateMutation,
} from "customer-account-api.generated";

export const WISHLIST_PRODUCT_ID_PATTERN = /^gid:\/\/shopify\/Product\/\d+$/;
export const MAX_WISHLIST_SIZE = 100;

const WISHLIST_SETUP_GRAPHQL_ERROR_CODES = new Set([
  "ACCESS_DENIED",
  "FORBIDDEN",
]);
const WISHLIST_SETUP_USER_ERROR_CODES = new Set([
  "APP_NOT_AUTHORIZED",
  "DISALLOWED_OWNER_TYPE",
  "INVALID_TYPE",
]);

export type WishlistRecord = {
  customerId: string;
  compareDigest: string | null;
  productIds: string[];
};

export async function readWishlist(
  customerAccount: CustomerAccount,
): Promise<WishlistRecord> {
  const { data: result, errors } =
    await customerAccount.query<WishlistCustomerQuery>(WISHLIST_QUERY);

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  if (!result?.customer) {
    throw new Error("Customer account is unavailable.");
  }

  return {
    customerId: result.customer.id,
    compareDigest: result.customer.wishlist?.compareDigest ?? null,
    productIds: parseWishlist(result.customer.wishlist?.value),
  };
}

export async function writeWishlist(
  customerAccount: CustomerAccount,
  wishlist: WishlistRecord,
  productIds: string[],
) {
  const { data: result, errors } =
    await customerAccount.mutate<WishlistUpdateMutation>(
      WISHLIST_UPDATE_MUTATION,
      {
        variables: {
          metafields: [
            {
              ownerId: wishlist.customerId,
              namespace: "custom",
              key: "aspen_wishlist",
              type: "list.single_line_text_field",
              value: JSON.stringify(productIds),
              compareDigest: wishlist.compareDigest,
            },
          ],
        },
      },
    );

  if (errors?.length) {
    return {
      ok: false as const,
      conflict: false,
      setupRequired: errors.some((error) =>
        WISHLIST_SETUP_GRAPHQL_ERROR_CODES.has(
          String(error.extensions?.code ?? ""),
        ),
      ),
      message: errors[0].message,
    };
  }

  const payload = result?.metafieldsSet;
  if (!payload) {
    return {
      ok: false as const,
      conflict: false,
      setupRequired: false,
      message: "Wishlist is temporarily unavailable.",
    };
  }

  const userError = payload.userErrors[0];
  if (!userError) {
    return {
      ok: true as const,
      conflict: false,
      setupRequired: false,
      message: "",
    };
  }

  const conflict = userError.code === "STALE_OBJECT";
  return {
    ok: false as const,
    conflict,
    setupRequired: WISHLIST_SETUP_USER_ERROR_CODES.has(userError.code ?? ""),
    message: conflict
      ? "Wishlist changed in another session. Please try again."
      : userError.message,
  };
}

export function updateWishlistProductIds(
  productIds: string[],
  productId: string,
  intent: "add" | "remove",
) {
  const nextIds = new Set(productIds);
  if (intent === "add") {
    nextIds.add(productId);
  } else {
    nextIds.delete(productId);
  }
  return Array.from(nextIds);
}

export function parseWishlist(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed.filter(
          (productId): productId is string =>
            typeof productId === "string" &&
            WISHLIST_PRODUCT_ID_PATTERN.test(productId),
        ),
      ),
    ).slice(0, MAX_WISHLIST_SIZE);
  } catch {
    return [];
  }
}

const WISHLIST_QUERY = `#graphql
  query WishlistCustomer {
    customer {
      id
      wishlist: metafield(
        namespace: "custom"
        key: "aspen_wishlist"
      ) {
        value
        compareDigest
      }
    }
  }
` as const;

const WISHLIST_UPDATE_MUTATION = `#graphql
  mutation WishlistUpdate($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        compareDigest
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;
