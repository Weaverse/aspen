import { gql } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen/react-router";
import { type LoaderFunctionArgs, redirect } from "react-router";
import invariant from "tiny-invariant";
import { Button } from "~/components/button";
import { Section } from "~/components/section";
import type { GetShopPrimaryDomainQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, CacheLong } from "~/utils/cache";
import { unwrapStorefront } from "~/utils/storefront";

/*
 If your online store had active orders before you launched your Hydrogen storefront,
 and the Hydrogen storefront uses the same domain formerly used by the online store,
 then customers will receive 404 pages when they click on the old order status URLs
 that are routing to your Hydrogen storefront. To prevent this, ensure that you redirect
 those requests back to Shopify.
*/
export async function loader({
  request,
  context: { storefront },
}: LoaderFunctionArgs) {
  const { origin } = new URL(request.url);
  const { shop } = await storefront
    .graphql(SHOP_PRIMARY_DOMAIN_QUERY, { cache: CacheLong() })
    .then(unwrapStorefront);
  invariant(shop, "Error redirecting to the order status URL");
  return redirect(request.url.replace(origin, shop.primaryDomain.url));
}

export default function () {
  return null;
}

export function ErrorBoundary() {
  const { t } = useTranslation();
  return (
    <Section width="fixed" verticalPadding="medium">
      <h4 className="mb-8 text-center font-medium text-red-600 lg:mb-20">
        {t("system.orderRedirectError")}
      </h4>
      <div className="mt-8 flex w-full items-baseline justify-between">
        <Button onClick={() => window.location.reload()}>
          {t("system.tryAgain")}
        </Button>
      </div>
    </Section>
  );
}

export const SHOP_PRIMARY_DOMAIN_QUERY = gql(`query getShopPrimaryDomain {
  shop {
    primaryDomain {
      url
    }
  }
}`);
