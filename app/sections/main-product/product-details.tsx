import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";
import { useRouteLoaderData } from "react-router";
import { Link } from "~/components/link";
import type { loader as productLoader } from "~/routes/($locale).products.$productHandle";

interface ProductDetailsProps {
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
  showShortDescription?: boolean;
  descriptionTitle?: string;
  openDescriptionByDefault?: boolean;
  product?: any;
  shop?: any;
}

export function ProductDetails({
  showShippingPolicy,
  showRefundPolicy,
  showShortDescription = true,
  descriptionTitle = "Dimensions",
  openDescriptionByDefault = true,
  product: propProduct,
  shop: propShop,
}: ProductDetailsProps) {
  const loaderData = useRouteLoaderData<typeof productLoader>(
    "routes/($locale).products.$productHandle",
  );
  const product = propProduct || loaderData?.product;
  const shop = propShop || loaderData?.shop;

  if (!product) {
    return null;
  }

  const { description, descriptionHtml, summary } = product || {};
  const { shippingPolicy, refundPolicy } = shop || {};
  const details = [
    showShortDescription && summary && { title: "Summary", content: summary },
    (descriptionHtml || description) && {
      title: descriptionTitle,
      content: descriptionHtml || description,
      openByDefault: openDescriptionByDefault,
    },
    showShippingPolicy &&
      shippingPolicy?.body && {
        title: "Shipping",
        content: getExcerpt(shippingPolicy.body),
        learnMore: `/policies/${shippingPolicy.handle}`,
      },
    showRefundPolicy &&
      refundPolicy?.body && {
        title: "Returns",
        content: getExcerpt(refundPolicy.body),
        learnMore: `/policies/${refundPolicy.handle}`,
      },
  ].filter(Boolean);

  if (details.length === 0) {
    return null;
  }

  return (
    <Accordion.Root
      type="multiple"
      defaultValue={details
        .filter((detail) => detail.openByDefault)
        .map((detail) => detail.title)}
    >
      {details.map(({ title, content, learnMore }, index) => (
        <Accordion.Item
          key={title}
          value={title}
          className={clsx(
            index === details.length - 1 && "border-line-subtle border-b",
            "data-[state=open]:pb-6",
          )}
        >
          <Accordion.Trigger
            className={clsx([
              "flex w-full justify-between py-6",
              "border-line-subtle border-t",
              "data-[state=open]:[&>.minus]:inline-block",
              "data-[state=open]:[&>.plus]:hidden",
            ])}
          >
            <span className="font-semibold uppercase">{title}</span>
            <MinusIcon className="minus hidden h-4 w-4" />
            <PlusIcon className="plus h-4 w-4" />
          </Accordion.Trigger>
          <Accordion.Content
            style={
              {
                "--expand-to": "var(--radix-accordion-content-height)",
                "--expand-duration": "0.15s",
                "--collapse-from": "var(--radix-accordion-content-height)",
                "--collapse-duration": "0.15s",
              } as React.CSSProperties
            }
            className={clsx([
              "overflow-hidden",
              "data-[state=closed]:animate-collapse",
              "data-[state=open]:animate-expand",
            ])}
          >
            <div
              suppressHydrationWarning
              className="prose prose-sm max-w-none font-normal text-body dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            {learnMore && (
              <Link
                className="border-line-subtle border-b pb-px text-body-subtle"
                to={learnMore}
              >
                Learn more
              </Link>
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function getExcerpt(text: string) {
  const regex = /<p.*>(.*?)<\/p>/;
  const match = regex.exec(text);
  return match?.length ? match[0] : text;
}
