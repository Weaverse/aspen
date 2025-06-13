import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  Plus,
  XLogo,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Button } from "~/components/button";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { RevealUnderline } from "~/reveal-underline";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import { CountrySelector } from "./country-selector";

let variants = cva("", {
  variants: {
    width: {
      full: "",
      stretch: "",
      fixed: "max-w-(--page-width) mx-auto",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "px-3 md:px-4 lg:px-6 mx-auto",
    },
  },
});

export function Footer() {
  let { shopName } = useShopMenu();
  let {
    footerWidth,
    socialFacebook,
    socialInstagram,
    socialLinkedIn,
    socialX,
    footerLogoData,
    footerLogoWidth,
    bio,
    copyright,
    addressTitle,
    storeAddress,
    storeEmail,
    newsletterTitle,
    newsletterDescription,
    newsletterPlaceholder,
    newsletterButtonText,
  } = useThemeSettings();
  let fetcher = useFetcher<any>();
  let [message, setMessage] = useState("");
  let [error, setError] = useState("");

  let handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setMessage("");
    setError("");
    fetcher.submit(event.currentTarget);
  };

  useEffect(() => {
    if (fetcher.data) {
      let message = (fetcher.data as any)?.message;
      if (!fetcher.data.success) {
        let error = message?.errors[0]?.detail;
        setError(error);
      } else {
        setMessage("Thank you for signing up!");
      }
    }
  }, [fetcher.data]);

  let socialItems = [
    {
      name: "Instagram",
      to: socialInstagram,
      icon: <InstagramLogo className="w-5 h-5" />,
    },
    {
      name: "X",
      to: socialX,
      icon: <XLogo className="w-5 h-5" />,
    },
    {
      name: "LinkedIn",
      to: socialLinkedIn,
      icon: <LinkedinLogo className="w-5 h-5" />,
    },
    {
      name: "Facebook",
      to: socialFacebook,
      icon: <FacebookLogo className="w-5 h-5" />,
    },
  ];

  return (
    <footer
      className={cn(
        "w-full bg-(--color-footer-bg) text-(--color-footer-text) pt-9 lg:pt-16",
        variants({ padding: footerWidth })
      )}
    >
      <div className={cn("w-full h-full", variants({ width: footerWidth }))}>
        <div className="md:space-y-9 divide-y divide-line-subtle">
          <div className="w-full grid md:grid-cols-2 grid-cols-1 gap-8">
            <div className="flex flex-col justify-between gap-6">
              {footerLogoData ? (
                <div className="relative" style={{ width: footerLogoWidth }}>
                  <Image
                    data={footerLogoData}
                    sizes="auto"
                    width={500}
                    className="w-full h-full object-contain object-left"
                  />
                </div>
              ) : (
                <div className="font-medium text-base uppercase">
                  {shopName}
                </div>
              )}
              <div className="flex flex-col gap-4">
                {bio ? <div dangerouslySetInnerHTML={{ __html: bio }} /> : null}
              </div>
            </div>
            <div className="flex flex-col gap-10">
              <div className="lg:block md:hidden block">
                <FooterMenu />
              </div>
              <div className="flex flex-col gap-6">
                <div className="text-base">{addressTitle}</div>
                <div className="space-y-2">
                  <p>{storeAddress}</p>
                  <p>Email: {storeEmail}</p>
                </div>
              </div>
              <div className="flex flex-col gap-6 lg:w-fit w-full">
                <div className="text-base">{newsletterTitle}</div>
                <div className="space-y-2">
                  <p>{newsletterDescription}</p>
                  <fetcher.Form
                    onSubmit={handleSubmit}
                    action="/api/klaviyo"
                    method="POST"
                    encType="multipart/form-data"
                    className="flex gap-3"
                  >
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={newsletterPlaceholder}
                      className="text-body focus-visible:outline-hidden px-3 placeholder:text-[#918379] border border-line-subtle lg:w-80 w-full"
                    />
                    <Button
                      variant="primary"
                      type="submit"
                      loading={fetcher.state === "submitting"}
                    >
                      {newsletterButtonText}
                    </Button>
                  </fetcher.Form>
                  <div className="h-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 py-1 px-2 mb-6 flex gap-1 w-fit">
                        <p className="font-semibold">ERROR:</p>
                        <p>{error}</p>
                      </div>
                    )}
                    {message && (
                      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 py-1 px-2 mb-6 flex gap-1 w-fit">
                        <p>{message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="lg:hidden md:block hidden">
              <FooterMenu />
            </div>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 justify-center items-center py-9 gap-y-6">
              <p className="order-3 md:col-span-2 lg:order-none lg:col-span-1">
                {copyright}
              </p>
              <div className="flex justify-start lg:justify-center items-center order-1">
                <CountrySelector inputClassName="px-4 py-3" />
              </div>
              <div className="flex gap-4 justify-start md:justify-end order-2">
                {socialItems.map((social) =>
                  social.to ? (
                    <Link
                      key={social.name}
                      to={social.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-lg"
                    >
                      {social.icon}
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterMenu() {
  let { footerMenu } = useShopMenu();
  let items = footerMenu.items as unknown as SingleMenuItem[];
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={items.map(({ id }) => id)}
      className="w-full grid lg:grid-cols-4 lg:gap-8 md:grid-cols-3 md:gap-5 pt-0 md:pt-9"
    >
      {items.map(({ id, to, title, items: subItems }) => {
        const isEmpty = !subItems || subItems.length === 0;

        return (
          <Accordion.Item
            key={id}
            value={id}
            className="flex flex-col border-b border-line-subtle md:border-none"
          >
            {!isEmpty ? (
              <Accordion.Trigger className="flex py-4 justify-between items-center md:hidden text-left font-medium data-[state=open]:[&>svg]:rotate-90">
                {["#", "/"].includes(to) ? (
                  <span>{title}</span>
                ) : (
                  <Link to={to}>{title}</Link>
                )}
                <Plus className="w-4 h-4 transition-transform rotate-0" />
              </Accordion.Trigger>
            ) : (
              <div className="py-4 md:hidden text-left font-medium">
                {["#", "/"].includes(to) ? (
                  <span>{title}</span>
                ) : (
                  <Link to={to}>{title}</Link>
                )}
              </div>
            )}

            <div className="text-lg font-medium hidden md:block">
              {["#", "/"].includes(to) ? title : <Link to={to}>{title}</Link>}
            </div>

            {!isEmpty && (
              <Accordion.Content
                style={
                  {
                    "--expand-duration": "0.15s",
                    "--expand-to": "var(--radix-accordion-content-height)",
                    "--collapse-duration": "0.15s",
                    "--collapse-from": "var(--radix-accordion-content-height)",
                  } as React.CSSProperties
                }
                className={clsx([
                  "overflow-hidden",
                  "data-[state=closed]:animate-collapse",
                  "data-[state=open]:animate-expand",
                ])}
              >
                <div className="pb-4 lg:pt-6 flex flex-col gap-2">
                  {subItems.map(({ id, to, title }) => (
                    <Link to={to} key={id} className="relative">
                      <RevealUnderline className="[--underline-color:var(--color-footer-text)]">
                        {title}
                      </RevealUnderline>
                    </Link>
                  ))}
                </div>
              </Accordion.Content>
            )}
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
