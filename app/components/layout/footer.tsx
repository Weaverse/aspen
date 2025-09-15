import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  Minus,
  Plus,
  XLogoIcon,
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

const variants = cva("", {
  variants: {
    width: {
      full: "",
      stretch: "",
      fixed: "mx-auto max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-5 pt-14 md:px-8 md:pt-14 lg:px-10 lg:pt-16",
    },
  },
});

export function Footer() {
  const { shopName } = useShopMenu();
  const {
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
  const fetcher = useFetcher<{ ok: boolean; error: string }>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const newsLetterResponse = fetcher.data;

  useEffect(() => {
    if (newsLetterResponse) {
      if (newsLetterResponse.ok) {
        setMessage("Thank you for signing up! 🎉");
      } else {
        setError(
          newsLetterResponse.error || "An error occurred while signing up.",
        );
      }
    }
  }, [newsLetterResponse]);

  const SOCIAL_ACCOUNTS = [
    {
      name: "Instagram",
      to: socialInstagram,
      Icon: InstagramLogoIcon,
    },
    {
      name: "X",
      to: socialX,
      Icon: XLogoIcon,
    },
    {
      name: "LinkedIn",
      to: socialLinkedIn,
      Icon: LinkedinLogoIcon,
    },
    {
      name: "Facebook",
      to: socialFacebook,
      Icon: FacebookLogoIcon,
    },
  ].filter((acc) => acc.to && acc.to.trim() !== "");

  return (
    <footer
      className={cn(
        "w-full bg-(--color-footer-bg) pt-5 text-(--color-footer-text) lg:pt-7",
        variants({ padding: footerWidth }),
      )}
    >
      <div className={cn("h-full w-full", variants({ width: footerWidth }))}>
        <div className="divide-line-subtle md:space-y-6 md:divide-y">
          <div className="grid w-full grid-cols-1 gap-0 pb-0 md:gap-8 md:pb-6 lg:grid-cols-2">
            {footerLogoData ? (
              <div
                className="relative md:order-none lg:order-1"
                style={{ width: footerLogoWidth }}
              >
                <Image
                  data={footerLogoData}
                  sizes="auto"
                  width={500}
                  className="h-full w-full object-contain object-left"
                />
              </div>
            ) : (
              <div className="font-medium text-base uppercase md:order-none lg:order-1">
                {shopName}
              </div>
            )}
            <div className="hidden gap-4 md:flex lg:hidden">
              <div className="flex w-full flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">{addressTitle}</span>
                  <div className="space-y-2">
                    <p>{storeAddress}</p>
                    <p>{storeEmail}</p>
                  </div>
                </div>
                {bio && (
                  <div className="flex flex-col gap-4">
                    <div dangerouslySetInnerHTML={{ __html: bio }} />
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col gap-6">
                <span className="font-semibold">{newsletterTitle}</span>
                <div className="space-y-2">
                  <p>{newsletterDescription}</p>
                  <fetcher.Form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      setMessage("");
                      setError("");
                      fetcher.submit(event.currentTarget);
                    }}
                    action="/api/klaviyo"
                    method="POST"
                    encType="multipart/form-data"
                    className="flex h-[54px] gap-3"
                  >
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={newsletterPlaceholder}
                      className="w-full border border-line-subtle bg-white px-3 text-body placeholder:text-[#918379] focus-visible:outline-hidden lg:w-80"
                    />
                    <Button
                      variant="primary"
                      type="submit"
                      loading={fetcher.state === "submitting"}
                      className="uppercase"
                    >
                      {newsletterButtonText}
                    </Button>
                  </fetcher.Form>
                  <div className="h-8">
                    {error && (
                      <div className="mb-6 flex w-fit gap-1 border-red-500 border-l-4 bg-red-100 px-2 py-1 text-red-700">
                        <p className="font-semibold">ERROR:</p>
                        <p>{error}</p>
                      </div>
                    )}
                    {message && (
                      <div className="mb-6 flex w-fit gap-1 border-green-500 border-l-4 bg-green-100 px-2 py-1 text-green-700">
                        <p>{message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:order-none md:hidden lg:order-3 lg:flex">
              <div className="flex flex-col gap-2">
                <span className="font-semibold">{addressTitle}</span>
                <div className="space-y-2">
                  <p>{storeAddress}</p>
                  <p>{storeEmail}</p>
                </div>
              </div>
              {bio ? (
                <div className="flex flex-col gap-4">
                  <div dangerouslySetInnerHTML={{ __html: bio }} />
                </div>
              ) : null}
            </div>
            <div className="order-2 block md:hidden lg:block">
              <FooterMenu />
            </div>

            <div className="order-4 flex w-full flex-col gap-4 pt-6 md:order-none md:hidden md:pt-0 lg:order-4 lg:flex lg:w-fit">
              <span className="font-semibold">{newsletterTitle}</span>
              <div className="space-y-2">
                <p>{newsletterDescription}</p>
                <fetcher.Form
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    setMessage("");
                    setError("");
                    fetcher.submit(event.currentTarget);
                  }}
                  action="/api/klaviyo"
                  method="POST"
                  encType="multipart/form-data"
                  className="flex h-[54px] gap-2"
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder={newsletterPlaceholder}
                    className="w-full border border-line-subtle bg-white px-3 text-body placeholder:text-[#918379] focus-visible:outline-hidden lg:w-80"
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    loading={fetcher.state === "submitting"}
                    className="uppercase"
                  >
                    {newsletterButtonText}
                  </Button>
                </fetcher.Form>
                {error ||
                  (message && (
                    <div className="h-8">
                      {error && (
                        <div className="mb-6 flex w-fit gap-1 border-red-500 border-l-4 bg-red-100 px-2 py-1 text-red-700">
                          <p className="font-semibold">ERROR:</p>
                          <p>{error}</p>
                        </div>
                      )}
                      {message && (
                        <div className="mb-6 flex w-fit gap-1 border-green-500 border-l-4 bg-green-100 px-2 py-1 text-green-700">
                          <p>{message}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div>
            <div className="hidden md:block lg:hidden">
              <FooterMenu />
            </div>
            <div className="grid grid-cols-1 items-center justify-center gap-y-6 pt-6 pb-6 md:grid-cols-2 md:pt-0 lg:grid-cols-3">
              <p className="order-3 md:col-span-2 lg:order-none lg:col-span-1">
                {copyright}
              </p>
              <div className="order-1 flex items-center justify-start lg:justify-center">
                <CountrySelector
                  inputClassName="px-4 py-2"
                  enableFlag={false}
                />
              </div>
              <div className="order-2 flex justify-start gap-4 md:justify-end">
                {SOCIAL_ACCOUNTS.map((social) =>
                  social.to ? (
                    <Link
                      key={social.name}
                      to={social.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-lg"
                    >
                      <social.Icon />
                    </Link>
                  ) : null,
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
  const { footerMenu } = useShopMenu();
  const items = footerMenu.items as unknown as SingleMenuItem[];
  const [openItems, setOpenItems] = useState<string[]>([]);

  // On desktop, open all items by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // md breakpoint
        setOpenItems(items.map(({ id }) => id));
      } else {
        setOpenItems([]); // Close all on mobile
      }
    };

    // Initial setup
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items]);

  return (
    <Accordion.Root
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="grid w-full pt-0 md:grid-cols-4 md:gap-5 md:pt-9 lg:grid-cols-4 lg:gap-8"
    >
      {items.map(({ id, to, title, items: subItems }) => {
        const isEmpty = !subItems || subItems.length === 0;
        const isOpen = openItems.includes(id);

        return (
          <Accordion.Item
            key={id}
            value={id}
            className="flex flex-col border-line-subtle border-b md:border-none"
          >
            {isEmpty ? (
              <div className="py-4 text-left font-medium md:hidden">
                {["#", "/"].includes(to) ? (
                  <span>{title}</span>
                ) : (
                  <Link className="w-fit" to={to}>
                    {title}
                  </Link>
                )}
              </div>
            ) : (
              <Accordion.Trigger className="group flex items-center justify-between py-4 text-left font-medium transition-all duration-200 hover:text-opacity-80 md:hidden">
                <span>{title}</span>
                <div className="relative h-4 w-4">
                  <Plus
                    className={clsx(
                      "absolute h-4 w-4 transition-all duration-300 ease-in-out",
                      isOpen
                        ? "rotate-90 scale-0 opacity-0"
                        : "rotate-0 scale-100 opacity-100",
                    )}
                  />
                  <Minus
                    className={clsx(
                      "absolute h-4 w-4 transition-all duration-300 ease-in-out",
                      isOpen
                        ? "rotate-0 scale-100 opacity-100"
                        : "rotate-90 scale-0 opacity-0",
                    )}
                  />
                </div>
              </Accordion.Trigger>
            )}

            <div className="hidden font-semibold md:block">
              {isEmpty ? (
                ["#", "/"].includes(to) ? (
                  title
                ) : (
                  <Link to={to}>{title}</Link>
                )
              ) : (
                <span>{title}</span>
              )}
            </div>

            {!isEmpty && (
              <Accordion.Content
                style={
                  {
                    "--expand-duration": "0.3s",
                    "--expand-to": "var(--radix-accordion-content-height)",
                    "--collapse-duration": "0.3s",
                    "--collapse-from": "var(--radix-accordion-content-height)",
                  } as React.CSSProperties
                }
                className={clsx([
                  "overflow-hidden transition-all",
                  "data-[state=closed]:animate-collapse",
                  "data-[state=open]:animate-expand",
                ])}
              >
                <div className="fade-in flex animate-in flex-col gap-2 pt-4 pb-4 duration-200">
                  {subItems.map(({ id, to, title }) => (
                    <Link to={to} key={id} className="relative w-fit">
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
