import { flattenConnection } from "@shopify/hydrogen";
import { gql } from "@shopify/hydrogen/customer-account";
import { useTranslation } from "@weaverse/hydrogen/react-router";
import type * as React from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { Link } from "~/components/link";
import { Money } from "~/components/money";
import { Pagination } from "~/components/pagination";
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from "~/graphql/customer-types";
import { useLocale } from "~/hooks/use-locale";
import { formatDate } from "~/utils/locale";
import { getPaginationVariables } from "~/utils/pagination";
import { getMetaTranslator } from "~/utils/seo-translation";

// https://shopify.dev/docs/api/customer/latest/objects/Order
export const ORDER_ITEM_FRAGMENT = gql(`fragment OrderItem on Order {
  totalPrice {
    amount
    currencyCode
  }
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  id
  number
  processedAt
}`);

// https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_ORDERS_FRAGMENT =
  gql(`fragment CustomerOrders on Customer {
  orders(
    sortKey: PROCESSED_AT
    reverse: true
    first: $first
    last: $last
    before: $startCursor
    after: $endCursor
  ) {
    nodes {
      ...OrderItem
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      endCursor
      startCursor
    }
  }
}

fragment OrderItem on Order {
  totalPrice {
    amount
    currencyCode
  }
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  id
  number
  processedAt
}`);

// https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_ORDERS_QUERY =
  gql(`query CustomerOrders($endCursor: String, $first: Int, $last: Int, $startCursor: String) {
  customer {
    ...CustomerOrders
  }
}

fragment CustomerOrders on Customer {
  orders(
    sortKey: PROCESSED_AT
    reverse: true
    first: $first
    last: $last
    before: $startCursor
    after: $endCursor
  ) {
    nodes {
      ...OrderItem
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      endCursor
      startCursor
    }
  }
}

fragment OrderItem on Order {
  totalPrice {
    amount
    currencyCode
  }
  financialStatus
  fulfillments(first: 1) {
    nodes {
      status
    }
  }
  id
  number
  processedAt
}`);

export const meta: MetaFunction = ({ matches }) => {
  return [{ title: getMetaTranslator(matches)("seo.orders") }];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const { data, errors } = await context.customerAccount.graphql(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: { ...paginationVariables },
    },
  );

  if (errors?.length || !data?.customer) {
    throw new Error("Customer orders not found");
  }

  return { customer: data.customer };
}

export default function Orders() {
  const { t } = useTranslation();
  const { customer } = useLoaderData<{ customer: CustomerOrdersFragment }>();
  const { orders } = customer;
  return (
    <div className="orders">
      {orders.nodes.length ? (
        <div className="account-orders">
          <PaginatedOrders connection={orders}>
            {({ node: order }) => <OrderItem key={order.id} order={order} />}
          </PaginatedOrders>
        </div>
      ) : (
        <div>
          <p>{t("account.noOrders")}</p>
          <br />
          <p>
            <Link to="/collections">{t("account.startShopping")}</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function PaginatedOrders<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>["connection"];
  children: (props: { node: NodesType; index: number }) => React.ReactNode;
  resourcesClassName?: string;
}) {
  const { t } = useTranslation();
  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index }),
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? (
                t("system.loading")
              ) : (
                <span>{t("account.loadPrevious")}</span>
              )}
            </PreviousLink>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            <NextLink>
              {isLoading ? (
                t("system.loading")
              ) : (
                <span>{t("account.loadMore")}</span>
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}

function OrderItem({ order }: { order: OrderItemFragment }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <>
      <fieldset>
        <Link to={`/account/orders/${btoa(order.id)}`}>
          <strong>#{order.number}</strong>
        </Link>
        <p>{formatDate(order.processedAt, locale)}</p>
        <p>{order.financialStatus}</p>
        {fulfillmentStatus && <p>{fulfillmentStatus}</p>}
        <Money data={order.totalPrice} />
        <Link to={`/account/orders/${btoa(order.id)}`}>
          {t("account.viewOrder")}
        </Link>
      </fieldset>
      <br />
    </>
  );
}
