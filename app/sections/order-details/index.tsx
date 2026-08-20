import { TagIcon } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import type { OrderFragment } from "customer-account-api.generated";
import type { CSSProperties, ReactNode, Ref } from "react";
import { useLoaderData } from "react-router";
import { getOrderStatusLabel } from "~/components/customer/orders";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useLocale } from "~/hooks/use-locale";
import type { I18nLocale } from "~/types/locale";
import { cn } from "~/utils/cn";
import { formatDate, formatNumber } from "~/utils/locale";

type OrderLineItem = OrderFragment["lineItems"]["nodes"][number];
type DiscountApplication =
  OrderFragment["discountApplications"]["nodes"][number];

interface OrderDetailsRouteData {
  order?: OrderFragment;
  lineItems?: OrderLineItem[];
  fulfillmentStatus?: string;
}

interface OrderDetailsSectionProps
  extends Partial<Omit<HydrogenComponentProps, "children">> {
  heading?: string;
  backLabel?: string;
  orderNumberLabel?: string;
  placedOnLabel?: string;
  statusHeading?: string;
  shippingAddressHeading?: string;
  statusCardHeading?: string;
  detailsHeading?: string;
  itemPriceLabel?: string;
  quantityLabel?: string;
  summaryHeading?: string;
  subtotalLabel?: string;
  discountLabel?: string;
  shippingNote?: string;
  totalLabel?: string;
  unfulfilledLabel?: string;
  firstVariantLabel?: string;
  secondVariantLabel?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  lineColor?: string;
  statusBackgroundColor?: string;
  statusTextColor?: string;
  discountBackgroundColor?: string;
  className?: string;
  ref?: Ref<HTMLElement>;
  style?: CSSProperties;
}

function OrderDetailsSection({
  heading = "ORDER",
  backLabel = "BACK TO ACCOUNT",
  orderNumberLabel = "ORDER NO.",
  placedOnLabel = "PLACED ON",
  statusHeading = "ORDER STATUS",
  shippingAddressHeading = "SHIPPING ADDRESS",
  statusCardHeading = "ORDER STATUS",
  detailsHeading = "ORDER DETAILS",
  itemPriceLabel = "Item price:",
  quantityLabel = "QTY",
  summaryHeading = "ORDER SUMMARY",
  subtotalLabel = "Subtotal",
  discountLabel = "Discount",
  shippingNote = "Shipping & taxes calculated at checkout",
  totalLabel = "Total",
  unfulfilledLabel = "UNFULFILLED",
  firstVariantLabel = "Color",
  secondVariantLabel = "Size",
  backgroundColor = "#EDEDED",
  cardColor = "#FFFFFF",
  textColor = "#343231",
  mutedTextColor = "#9D9D9D",
  lineColor = "#D8D8D8",
  statusBackgroundColor = "#4D4946",
  statusTextColor = "#343231",
  discountBackgroundColor = "#EBE8E5",
  className,
  ref,
  style,
  ...rest
}: OrderDetailsSectionProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const routeData = useLoaderData() as OrderDetailsRouteData;
  const order = routeData?.order;
  const lineItems = routeData?.lineItems ?? [];

  if (!order) {
    return null;
  }

  const totalDiscount = lineItems.reduce((total, lineItem) => {
    const itemDiscount = Number.parseFloat(lineItem.totalDiscount.amount);
    return total + (Number.isFinite(itemDiscount) ? itemDiscount : 0);
  }, 0);
  const totalDiscountMoney = {
    amount: totalDiscount.toFixed(2),
    currencyCode: order.totalPrice.currencyCode,
  };
  const statusLabel = getOrderStatusLabel(
    routeData.fulfillmentStatus,
    t,
    unfulfilledLabel,
  );
  const sectionStyle = {
    ...style,
    "--order-background": backgroundColor,
    "--order-card": cardColor,
    "--order-text": textColor,
    "--order-muted": mutedTextColor,
    "--order-line": lineColor,
    "--order-status-background": statusBackgroundColor,
    "--order-status-text": statusTextColor,
    "--order-discount-background": discountBackgroundColor,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      {...rest}
      style={sectionStyle}
      className={cn(
        "bg-(--order-background) font-body text-(--order-text)",
        className,
      )}
    >
      <div className="mx-auto max-w-[974px] px-4 pt-6 pb-10 md:px-8 md:pt-12 md:pb-20">
        <header>
          <h1 className="font-heading font-normal text-[36px] uppercase leading-10 tracking-[-0.025em] md:text-[44px] md:leading-[1.1]">
            {heading}
          </h1>
          <Link
            to="/account"
            className="mt-1 inline-flex font-normal text-(--order-muted) text-xs uppercase leading-4"
          >
            {backLabel}
          </Link>
        </header>

        <div className="mt-14 text-sm uppercase leading-[22px] md:mt-9">
          <p>
            {orderNumberLabel} {order.name}
          </p>
          <p>
            {placedOnLabel} {formatOrderDate(order.processedAt, locale)}
          </p>
        </div>

        <section
          className="mt-9 md:mt-10"
          aria-labelledby="order-status-heading"
        >
          <h2 id="order-status-heading" className="text-sm uppercase leading-5">
            {statusHeading}
          </h2>
          <div className="mt-[11px] grid grid-cols-1 gap-4 md:mt-4 md:grid-cols-2">
            <article className="min-h-[208px] bg-(--order-card) p-6 md:h-[186px] md:min-h-0">
              <h3 className="font-semibold text-xs uppercase leading-4">
                {shippingAddressHeading}
              </h3>
              {order.shippingAddress ? (
                <address className="mt-6 not-italic text-sm leading-[22px]">
                  {order.shippingAddress.name ? (
                    <p className="font-medium uppercase">
                      {order.shippingAddress.name}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    {order.shippingAddress.formatted.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </address>
              ) : (
                <p className="mt-6 text-sm leading-[22px]">
                  {t("account.noShippingAddress")}
                </p>
              )}
            </article>
            <article className="min-h-[208px] bg-(--order-card) p-6 md:h-[186px] md:min-h-0">
              <h3 className="font-semibold text-xs uppercase leading-4">
                {statusCardHeading}
              </h3>
              <p className="mt-6">
                <span className="inline-flex min-h-[27px] min-w-[97px] items-center justify-center bg-(--order-status-background) px-2.5 font-normal text-(--order-status-text) text-xs uppercase leading-none">
                  {statusLabel}
                </span>
              </p>
            </article>
          </div>
        </section>

        <section
          className="mt-[45px] md:mt-[43px]"
          aria-labelledby="order-details-heading"
        >
          <h2
            id="order-details-heading"
            className="text-sm uppercase leading-5"
          >
            {detailsHeading}
          </h2>
          <ul className="mt-[11px] flex flex-col gap-6 md:mt-4 md:gap-4">
            {lineItems.map((lineItem) => (
              <OrderLineItemCard
                key={lineItem.id}
                lineItem={lineItem}
                itemPriceLabel={itemPriceLabel}
                quantityLabel={quantityLabel}
                discountLabel={discountLabel}
                firstVariantLabel={firstVariantLabel}
                secondVariantLabel={secondVariantLabel}
              />
            ))}
          </ul>
        </section>

        <section
          className="mt-10 min-h-[336px] bg-(--order-card) p-6"
          aria-labelledby="order-summary-heading"
        >
          <h2
            id="order-summary-heading"
            className="font-semibold text-xs uppercase leading-4"
          >
            {summaryHeading}
          </h2>

          {order.discountApplications.nodes.length ? (
            <div className="mt-[30px] flex flex-wrap gap-2">
              {order.discountApplications.nodes.map((application, index) => (
                <DiscountBadge
                  application={application}
                  fallbackLabel={discountLabel}
                  key={`${getDiscountTitle(application, discountLabel)}-${index}`}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-6 border-(--order-line) border-t pt-6 text-sm leading-[22px]">
            <SummaryRow label={subtotalLabel}>
              <Money data={order.subtotal ?? order.totalPrice} />
            </SummaryRow>
            <SummaryRow className="mt-3" label={discountLabel}>
              <span>-</span>
              <Money data={totalDiscountMoney} />
            </SummaryRow>
            <p className="mt-5 text-(--order-muted)">{shippingNote}</p>
            <div className="mt-6 border-(--order-line) border-t pt-6">
              <SummaryRow className="font-semibold" label={totalLabel}>
                <Money data={order.totalPrice} />
              </SummaryRow>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default OrderDetailsSection;

function OrderLineItemCard({
  lineItem,
  itemPriceLabel,
  quantityLabel,
  discountLabel,
  firstVariantLabel,
  secondVariantLabel,
}: {
  lineItem: OrderLineItem;
  itemPriceLabel: string;
  quantityLabel: string;
  discountLabel: string;
  firstVariantLabel: string;
  secondVariantLabel: string;
}) {
  const variantLines = formatVariantLines(
    lineItem.variantTitle,
    firstVariantLabel,
    secondVariantLabel,
  );

  return (
    <li className="flex min-w-0 flex-col bg-(--order-card) md:min-h-[320px] md:flex-row">
      <div className="h-[calc(86.1809vw-27.5779px)] max-h-[343px] w-full shrink-0 overflow-hidden md:h-[320px] md:w-[320px]">
        {lineItem.image ? (
          <Image
            data={lineItem.image}
            width={800}
            height={800}
            sizes="(min-width: 768px) 320px, calc(100vw - 32px)"
            alt={lineItem.image.altText ?? lineItem.title}
            className="bg-white"
          />
        ) : null}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col p-6 md:min-h-[320px]",
          lineItem.discountAllocations.length
            ? "min-h-[262px]"
            : "min-h-[190px]",
        )}
      >
        <div>
          <h3 className="font-semibold text-xs uppercase leading-4">
            {lineItem.title}
          </h3>
          {variantLines.length ? (
            <div className="mt-4 text-xs leading-[18px] md:mt-5">
              {variantLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {lineItem.discountAllocations.length ? (
            <div className="mt-4 flex flex-col items-start gap-2 md:hidden">
              {lineItem.discountAllocations.map((discount, index) => (
                <DiscountBadge
                  application={discount.discountApplication}
                  amount={discount.allocatedAmount}
                  fallbackLabel={discountLabel}
                  key={`${getDiscountTitle(discount.discountApplication, discountLabel)}-${index}`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-5 pt-4 text-xs leading-[18px] md:gap-10">
          <div className="min-w-0">
            <span className="block md:inline">{itemPriceLabel}</span>{" "}
            {lineItem.price ? <Money data={lineItem.price} /> : "—"}
          </div>
          <div className="whitespace-nowrap uppercase">
            {quantityLabel} <span className="ml-2">{lineItem.quantity}</span>
          </div>
          <div className="whitespace-nowrap text-right">
            {lineItem.currentTotalPrice ? (
              <Money data={lineItem.currentTotalPrice} />
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function DiscountBadge({
  application,
  amount,
  fallbackLabel,
}: {
  application: DiscountApplication;
  amount?: OrderFragment["totalPrice"];
  fallbackLabel: string;
}) {
  const locale = useLocale();
  const value = application.value;
  const discountValue = amount
    ? formatMoneyForBadge(amount, locale)
    : value.__typename === "MoneyV2"
      ? formatMoneyForBadge(value, locale)
      : `${value.percentage}%`;

  return (
    <span className="inline-flex h-6 w-fit max-w-full items-center gap-1.5 whitespace-nowrap bg-(--order-discount-background) px-2 text-(--order-muted) text-xs leading-4">
      <TagIcon className="size-3.5 shrink-0" />
      <span className="truncate">
        {getDiscountTitle(application, fallbackLabel)} (-{discountValue})
      </span>
    </span>
  );
}

function SummaryRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-6", className)}>
      <span>{label}</span>
      <div className="inline-flex whitespace-nowrap">{children}</div>
    </div>
  );
}

function getDiscountTitle(
  application: DiscountApplication,
  fallbackLabel: string,
) {
  if ("code" in application && application.code) {
    return application.code;
  }
  if ("title" in application && application.title) {
    return application.title;
  }
  return fallbackLabel;
}

function formatVariantLines(
  variantTitle: string | null | undefined,
  firstLabel: string,
  secondLabel: string,
) {
  if (!variantTitle || variantTitle.toLowerCase() === "default title") {
    return [];
  }

  const values = variantTitle.split(" / ").map((value) => value.trim());
  return values.map((value, index) => {
    const label = index === 0 ? firstLabel : index === 1 ? secondLabel : "";
    return label ? `${label} ${value}` : value;
  });
}

function formatOrderDate(processedAt: string, locale: I18nLocale) {
  return formatDate(processedAt, locale, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).toLocaleUpperCase(`${locale.language}-${locale.country}`);
}

function formatMoneyForBadge(
  { amount, currencyCode }: OrderFragment["totalPrice"],
  locale: I18nLocale,
) {
  return formatNumber(Number.parseFloat(amount), locale, {
    currency: currencyCode,
    style: "currency",
  });
}

export const schema = createSchema({
  type: "order-details",
  title: "Order details",
  limit: 1,
  enabled: ({ page }) => page.type === "CUSTOM" && page.handle === "order",
  settings: [
    {
      group: "Headings",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "ORDER",
        },
        {
          type: "text",
          name: "backLabel",
          label: "Back link label",
          defaultValue: "BACK TO ACCOUNT",
        },
        {
          type: "text",
          name: "statusHeading",
          label: "Status heading",
          defaultValue: "ORDER STATUS",
        },
        {
          type: "text",
          name: "detailsHeading",
          label: "Details heading",
          defaultValue: "ORDER DETAILS",
        },
        {
          type: "text",
          name: "summaryHeading",
          label: "Summary heading",
          defaultValue: "ORDER SUMMARY",
        },
      ],
    },
    {
      group: "Labels",
      inputs: [
        {
          type: "text",
          name: "orderNumberLabel",
          label: "Order number",
          defaultValue: "ORDER NO.",
        },
        {
          type: "text",
          name: "placedOnLabel",
          label: "Placed on",
          defaultValue: "PLACED ON",
        },
        {
          type: "text",
          name: "shippingAddressHeading",
          label: "Shipping address",
          defaultValue: "SHIPPING ADDRESS",
        },
        {
          type: "text",
          name: "statusCardHeading",
          label: "Status card",
          defaultValue: "ORDER STATUS",
        },
        {
          type: "text",
          name: "itemPriceLabel",
          label: "Item price",
          defaultValue: "Item price:",
        },
        {
          type: "text",
          name: "quantityLabel",
          label: "Quantity",
          defaultValue: "QTY",
        },
        {
          type: "text",
          name: "subtotalLabel",
          label: "Subtotal",
          defaultValue: "Subtotal",
        },
        {
          type: "text",
          name: "discountLabel",
          label: "Discount",
          defaultValue: "Discount",
        },
        {
          type: "text",
          name: "shippingNote",
          label: "Shipping note",
          defaultValue: "Shipping & taxes calculated at checkout",
        },
        {
          type: "text",
          name: "totalLabel",
          label: "Total",
          defaultValue: "Total",
        },
        {
          type: "text",
          name: "unfulfilledLabel",
          label: "Unfulfilled status",
          defaultValue: "UNFULFILLED",
        },
        {
          type: "text",
          name: "firstVariantLabel",
          label: "First option",
          defaultValue: "Color",
        },
        {
          type: "text",
          name: "secondVariantLabel",
          label: "Second option",
          defaultValue: "Size",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background",
          defaultValue: "#EDEDED",
        },
        {
          type: "color",
          name: "cardColor",
          label: "Cards",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text",
          defaultValue: "#343231",
        },
        {
          type: "color",
          name: "mutedTextColor",
          label: "Muted text",
          defaultValue: "#9D9D9D",
        },
        {
          type: "color",
          name: "lineColor",
          label: "Divider",
          defaultValue: "#D8D8D8",
        },
        {
          type: "color",
          name: "statusBackgroundColor",
          label: "Status background",
          defaultValue: "#4D4946",
        },
        {
          type: "color",
          name: "statusTextColor",
          label: "Status text",
          defaultValue: "#343231",
        },
        {
          type: "color",
          name: "discountBackgroundColor",
          label: "Discount badge",
          defaultValue: "#EBE8E5",
        },
      ],
    },
  ],
  presets: {
    heading: "ORDER",
    backLabel: "BACK TO ACCOUNT",
    orderNumberLabel: "ORDER NO.",
    placedOnLabel: "PLACED ON",
    statusHeading: "ORDER STATUS",
    shippingAddressHeading: "SHIPPING ADDRESS",
    statusCardHeading: "ORDER STATUS",
    detailsHeading: "ORDER DETAILS",
    itemPriceLabel: "Item price:",
    quantityLabel: "QTY",
    summaryHeading: "ORDER SUMMARY",
    subtotalLabel: "Subtotal",
    discountLabel: "Discount",
    shippingNote: "Shipping & taxes calculated at checkout",
    totalLabel: "Total",
    unfulfilledLabel: "UNFULFILLED",
    firstVariantLabel: "Color",
    secondVariantLabel: "Size",
    backgroundColor: "#EDEDED",
    cardColor: "#FFFFFF",
    textColor: "#343231",
    mutedTextColor: "#9D9D9D",
    lineColor: "#D8D8D8",
    statusBackgroundColor: "#4D4946",
    statusTextColor: "#343231",
    discountBackgroundColor: "#EBE8E5",
  },
});
