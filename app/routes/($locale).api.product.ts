import type { LoaderFunction } from "react-router";
import { data } from "react-router";
import type { Storefront } from "~/.server/storefront";
import { PRODUCT_QUERY } from "~/graphql/queries";
import type { ProductQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT } from "~/utils/cache";
import { skipPageRevalidationForStorefrontActions } from "~/utils/revalidation";
import { unwrapStorefront } from "~/utils/storefront";

export const shouldRevalidate = skipPageRevalidationForStorefrontActions;

export const loader: LoaderFunction = async ({
  request,
  context: { storefront },
}) => {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");
  if (handle) {
    const selectedOptions = Array.from(searchParams.entries())
      .filter(([name]) => name !== "handle")
      .map(([name, value]) => ({ name, value }));
    const productData = await getProductData(
      storefront,
      handle,
      selectedOptions,
    );
    return data(productData);
  }
  return data(null, { status: 404 });
};

async function getProductData(
  storefront: Storefront,
  handle: string,
  selectedOptions: Array<{ name: string; value: string }>,
) {
  const { product, shop } = await storefront
    .graphql(PRODUCT_QUERY, {
      variables: { handle, selectedOptions },
      cache: CACHE_DEFAULT,
    })
    .then(unwrapStorefront);
  return {
    shop,
    product,
    storeDomain: shop.primaryDomain.url,
  };
}

export type ProductData = Awaited<ReturnType<typeof getProductData>>;
