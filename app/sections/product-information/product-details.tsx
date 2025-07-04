import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";
import { Link, useLoaderData } from "react-router";
import type { loader as productLoader } from "~/routes/($locale).products.$productHandle";

export function ProductDetails({ showShippingPolicy, showRefundPolicy }) {
  const { shop, product } = useLoaderData<typeof productLoader>();
  const { description } = product;
  const { shippingPolicy, refundPolicy } = shop;
  const details = [
    { title: "Description", content: description },
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

  return (
    <Accordion.Root type="multiple">
      {details.map(({ title, content, learnMore }) => (
        <Accordion.Item key={title} value={title}>
          <Accordion.Trigger
            className={clsx([
              "flex justify-between py-4 w-full font-bold",
              "border-b border-line-subtle",
              "data-[state=open]:[&>.minus]:inline-block",
              "data-[state=open]:[&>.plus]:hidden",
            ])}
          >
            <span>{title}</span>
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
              className="prose dark:prose-invert py-2.5"
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
