import { flattenConnection } from "@shopify/hydrogen";
import type { FulfillmentStatus } from "@shopify/hydrogen/customer-account-api-types";
import type { OrderCardFragment } from "customer-account-api.generated";
import type { HTMLAttributes } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { cn } from "~/utils/cn";

export const ORDER_STATUS: Record<FulfillmentStatus, string> = {
  SUCCESS: "Success",
  PENDING: "Pending",
  OPEN: "Open",
  FAILURE: "Failure",
  ERROR: "Error",
  CANCELLED: "Cancelled",
};

type OrderCardsProps = {
  orders: OrderCardFragment[];
  heading?: string;
};

export function AccountOrderHistory({
  orders,
  heading = "ORDERS",
  className,
  ...rest
}: OrderCardsProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn(className)}>
      <h2 className="font-body font-normal text-[#343231] text-sm uppercase leading-5">
        {heading}
      </h2>
      {orders?.length ? <Orders orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="mt-[11px] bg-white p-5 font-body text-[#343231] text-sm">
      You haven&apos;t placed any orders yet.
    </div>
  );
}

function Orders({ orders }: OrderCardsProps) {
  return (
    <ul className="mt-[11px] grid grid-flow-row grid-cols-1 gap-5 md:grid-cols-2">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} />
      ))}
    </ul>
  );
}

function OrderCard({ order }: { order: OrderCardFragment }) {
  if (!order?.id) {
    return null;
  }

  const [legacyOrderId, key] = order.id.split("/").pop().split("?");
  const lineItems = flattenConnection(order?.lineItems);
  const firstLineItem = lineItems[0];
  if (!firstLineItem) {
    return null;
  }
  const fulfillmentStatus = flattenConnection(order?.fulfillments)[0]?.status;
  const orderLink = key
    ? `/account/orders/${legacyOrderId}?${key}`
    : `/account/orders/${legacyOrderId}`;
  const statusLabel = fulfillmentStatus
    ? ORDER_STATUS[fulfillmentStatus] || fulfillmentStatus
    : "Unfulfilled";

  return (
    <li className="flex h-[180px] min-w-0 bg-white font-body text-[#343231]">
      {firstLineItem.image && (
        <Link
          className="block h-[180px] w-[180px] shrink-0"
          to={orderLink}
          prefetch="intent"
          aria-label={`View order ${order.number}`}
        >
          <Image
            width={360}
            height={360}
            className="h-full w-full bg-white"
            alt={firstLineItem.image.altText ?? firstLineItem.title}
            src={firstLineItem.image.url}
          />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start px-4 py-5 text-left">
        <Link
          to={orderLink}
          prefetch="intent"
          className="line-clamp-1 font-semibold text-sm uppercase leading-5"
        >
          {lineItems.length > 1
            ? `${firstLineItem.title} ... +${lineItems.length - 1} more`
            : firstLineItem.title}
        </Link>
        <dl className="mt-2 flex flex-col text-sm leading-[22px]">
          <dt className="sr-only">Order ID</dt>
          <dd>Order no. #{order.number}</dd>
          <dt className="sr-only">Order Date</dt>
          <dd>{new Date(order.processedAt).toDateString()}</dd>
          <dt className="sr-only">Fulfillment Status</dt>
          <dd className="mt-10">
            <span className="inline-flex h-[27px] min-w-[97px] items-center justify-center bg-[#4D4946] px-2.5 font-normal text-[#343231] text-xs uppercase leading-none">
              {statusLabel}
            </span>
          </dd>
        </dl>
      </div>
    </li>
  );
}
