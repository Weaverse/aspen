import {
  CacheNone,
  flattenConnection,
  generateCacheControlHeader,
} from "@shopify/hydrogen";
import type { OrderFragment, OrderQuery } from "customer-account-api.generated";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  data as routeData,
  useLoaderData,
} from "react-router";
import OrderDetailsSection from "~/sections/order-details";
import {
  accountPath,
  accountPreviewOrderDetails,
  isAccountPreviewRequest,
} from "~/utils/account-preview.server";
import { getLocalizedMeta, getMetadataCopy } from "~/utils/metadata";
import { WeaverseContent } from "~/weaverse";

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const copy = getMetadataCopy(params.locale, "order");
  return getLocalizedMeta({
    locale: params.locale,
    page: "order",
    title: data?.order?.name ? `${copy.title} ${data.order.name}` : copy.title,
  });
};

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  if (!params.id) {
    return redirect(accountPath(params.locale));
  }

  const weaverseData = await context.weaverse.loadPage({
    type: "CUSTOM",
    handle: "order",
  });
  const isDesignMode = Boolean(
    weaverseData?.configs?.requestInfo?.queries?.isDesignMode,
  );

  if (isDesignMode || isAccountPreviewRequest(request)) {
    const order = accountPreviewOrderDetails();
    return routeData(
      {
        ...getOrderDetailsData(order),
        weaverseData,
      },
      { headers: { "Cache-Control": generateCacheControlHeader(CacheNone()) } },
    );
  }

  const queryParams = new URL(request.url).searchParams;
  const orderToken = queryParams.get("key");

  try {
    const orderId = orderToken
      ? `gid://shopify/Order/${params.id}?key=${orderToken}`
      : `gid://shopify/Order/${params.id}`;

    const { data: customerData, errors } =
      await context.customerAccount.query<OrderQuery>(CUSTOMER_ORDER_QUERY, {
        variables: { orderId },
      });

    if (errors?.length || !customerData?.order?.lineItems) {
      throw new Error("Order not found");
    }

    const order: OrderFragment = customerData.order;
    return routeData(
      {
        ...getOrderDetailsData(order),
        weaverseData,
      },
      { headers: { "Cache-Control": generateCacheControlHeader(CacheNone()) } },
    );
  } catch (error) {
    throw new Response(error instanceof Error ? error.message : undefined, {
      status: 404,
    });
  }
}

export default function OrderDetailsRoute() {
  const { weaverseData } = useLoaderData<typeof loader>();
  const isDesignMode = Boolean(
    weaverseData?.configs?.requestInfo?.queries?.isDesignMode,
  );
  const hasOrderDetailsSection = Boolean(
    weaverseData?.page?.items?.some((item) => item.type === "order-details"),
  );

  if (isDesignMode || hasOrderDetailsSection) {
    return <WeaverseContent />;
  }

  return <OrderDetailsSection />;
}

function getOrderDetailsData(order: OrderFragment) {
  const lineItems = flattenConnection(order.lineItems);
  const fulfillments = flattenConnection(order.fulfillments);
  const fulfillmentStatus = fulfillments[0]?.status ?? "UNFULFILLED";

  return { order, lineItems, fulfillmentStatus };
}

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/order
const CUSTOMER_ORDER_QUERY = `#graphql
  fragment OrderMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment DiscountApplication on DiscountApplication {
    ... on AutomaticDiscountApplication {
      title
    }
    ... on DiscountCodeApplication {
      code
    }
    value {
      __typename
      ... on MoneyV2 {
        ...OrderMoney
      }
      ... on PricingPercentageValue {
        percentage
      }
    }
  }
  fragment OrderLineItemFull on LineItem {
    id
    title
    quantity
    price {
      ...OrderMoney
    }
    currentTotalPrice {
      ...OrderMoney
    }
    totalPrice {
      ...OrderMoney
    }
    discountAllocations {
      allocatedAmount {
        ...OrderMoney
      }
      discountApplication {
        ...DiscountApplication
      }
    }
    totalDiscount {
      ...OrderMoney
    }
    image {
      altText
      height
      url
      id
      width
    }
    variantTitle
  }
  fragment Order on Order {
    id
    name
    statusPageUrl
    processedAt
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalTax {
      ...OrderMoney
    }
    totalPrice {
      ...OrderMoney
    }
    subtotal {
      ...OrderMoney
    }
    totalShipping {
      ...OrderMoney
    }
    shippingAddress {
      name
      formatted(withName: false)
      formattedArea
    }
    discountApplications(first: 100) {
      nodes {
        ...DiscountApplication
      }
    }
    lineItems(first: 100) {
      nodes {
        ...OrderLineItemFull
      }
    }
  }
  query Order($orderId: ID!) {
    order(id: $orderId) {
      ... on Order {
        ...Order
      }
    }
  }
` as const;
