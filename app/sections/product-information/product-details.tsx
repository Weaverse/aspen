import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";
import { Link, useLoaderData } from "react-router";
import type { loader as productLoader } from "~/routes/($locale).products.$productHandle";

interface ProductDetailsProps {
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
  product?: any;
  shop?: any;
}

export function ProductDetails({ 
  showShippingPolicy, 
  showRefundPolicy, 
  product: propProduct, 
  shop: propShop 
}: ProductDetailsProps) {
  // Try to get data from props first, fallback to useLoaderData if available
  let product, shop;
  
  try {
    const loaderData = useLoaderData<typeof productLoader>();
    product = propProduct || loaderData?.product;
    shop = propShop || loaderData?.shop;
  } catch {
    // If useLoaderData fails (not in route context), use props
    product = propProduct;
    shop = propShop;
  }

  if (!product) {
    return null;
  }

  const { description, summary } = product || {};
  const { shippingPolicy, refundPolicy } = shop || {};
  const details = [
    description && { title: "Description", content: description },
    summary && { title: "Summary", content: summary },
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
    <Accordion.Root type="multiple">
      {details.map(({ title, content, learnMore }, index) => (
        <Accordion.Item 
          key={title} 
          value={title}
          className={clsx(
            index === details.length - 1 && "border-b border-line-subtle",
            "data-[state=open]:pb-6",
          )}
        >
          <Accordion.Trigger
            className={clsx([
              "flex justify-between py-6 w-full",
              "border-t border-line-subtle",
              "data-[state=open]:[&>.minus]:inline-block",
              "data-[state=open]:[&>.plus]:hidden",
            ])}
          >
            <span className="uppercase font-normal">{title}</span>
            <MinusIcon className="w-4 h-4 minus hidden" />
            <PlusIcon className="w-4 h-4 plus" />
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
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            {learnMore && (
              <Link
                className="pb-px border-b border-line-subtle text-body-subtle"
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
