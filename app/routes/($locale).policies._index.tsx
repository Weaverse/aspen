import { FileTextIcon } from "@phosphor-icons/react";
import { gql } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen/react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import invariant from "tiny-invariant";
import { BreadCrumb } from "~/components/breadcrumb";
import { Link } from "~/components/link";
import { Section } from "~/components/section";
import type { PoliciesIndexQuery } from "~/graphql/storefront-types";
import { CACHE_DEFAULT, routeHeaders } from "~/utils/cache";
import { seoPayload } from "~/utils/seo.server";
import type { SeoConfig } from "~/utils/seo-meta";
import { localizedSeoMeta } from "~/utils/seo-translation";
import { unwrapStorefront } from "~/utils/storefront";

export const headers = routeHeaders;

type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export async function loader({
  request,
  context: { storefront },
}: LoaderFunctionArgs) {
  const data = await storefront
    .graphql(POLICIES_QUERY, { cache: CACHE_DEFAULT })
    .then(unwrapStorefront);

  invariant(data, "No data returned from Shopify API");

  const policies = Object.values(
    data.shop as NonNullableFields<typeof data.shop>,
  ).filter(Boolean);

  if (policies.length === 0) {
    throw new Response("Not found", { status: 404 });
  }

  const seo = seoPayload.policies({ policies, url: request.url });

  return {
    policies,
    seo,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return localizedSeoMeta(matches, data.seo as SeoConfig);
};

export default function Policies() {
  const { t } = useTranslation();
  const { policies } = useLoaderData<typeof loader>();

  return (
    <Section width="fixed" verticalPadding="medium">
      <BreadCrumb page={t("system.policies")} className="mb-4" />
      <h4 className="mb-8 font-medium lg:mb-20">{t("system.policies")}</h4>
      <div className="flex flex-col gap-3">
        {policies.map((policy) => {
          if (policy) {
            return (
              policy && (
                <Link
                  variant="underline"
                  className="w-fit gap-2"
                  to={`/policies/${policy.handle}`}
                >
                  <FileTextIcon className="h-5 w-5" />
                  <span>{policy.title}</span>
                </Link>
              )
            );
          }
          return null;
        })}
      </div>
    </Section>
  );
}

export const POLICIES_QUERY_PolicyIndex =
  gql(`fragment PolicyIndex on ShopPolicy {
  id
  title
  handle
}`);

export const POLICIES_QUERY = gql(`query PoliciesIndex {
  shop {
    privacyPolicy {
      ...PolicyIndex
    }
    shippingPolicy {
      ...PolicyIndex
    }
    termsOfService {
      ...PolicyIndex
    }
    refundPolicy {
      ...PolicyIndex
    }
    subscriptionPolicy {
      id
      title
      handle
    }
  }
}

fragment PolicyIndex on ShopPolicy {
  id
  title
  handle
}`);
