import { Minus, Plus } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type React from "react";
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

// Payment icon components
const PaymentIcon = ({ children, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 32"
    fill="none"
    {...props}
  >
    {children}
  </svg>
);

const PAYMENT_ICON_MAP: Record<string, React.ComponentType<any>> = {
  VISA: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#1434CB" />
      <path
        d="M21.244 21.5h-2.872l1.798-11h2.872l-1.798 11zm11.37-10.742c-.568-.222-1.464-.46-2.584-.46-2.848 0-4.854 1.472-4.867 3.578-.013 1.557 1.438 2.424 2.535 2.941 1.122.527 1.502.865 1.502 1.336-.013.725-.893 1.056-1.722 1.056-1.148 0-1.761-.167-2.699-.567l-.374-.169-.405 2.435c.674.304 1.925.566 3.226.58 3.03 0 4.995-1.456 5.02-3.706.013-1.233-.755-2.171-2.41-2.942-1.005-.502-1.619-.839-1.619-1.347.013-.46.53-.934 1.672-.934a5.405 5.405 0 0 1 2.171.413l.262.123.393-2.337zm6.01-.258h-2.222c-.687 0-1.204.195-1.502.906l-4.263 9.894h3.025s.493-1.336.605-1.63c.33 0 3.264.004 3.682.004.087.382.353 1.626.353 1.626h2.673l-2.35-11zm-3.63 7.114c.237-.623 1.148-3.038 1.148-3.038-.013.025.237-.632.38-1.043l.199.933s.555 2.614.674 3.148h-2.402zM17.3 10.5l-2.822 7.485-.299-1.498c-.53-1.756-2.171-3.655-4.009-4.607l2.572 9.605h3.05l4.532-11h-3.025z"
        fill="#fff"
      />
      <path
        d="M10.918 10.5H6.026l-.038.258c3.613.9 6.003 3.075 6.995 5.69l-1.01-4.928c-.174-.697-.68-.892-1.353-.902l-.702-.118z"
        fill="#F9A51A"
      />
    </PaymentIcon>
  ),
  MASTERCARD: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#000" />
      <circle cx="18" cy="16" r="8" fill="#EB001B" />
      <circle cx="30" cy="16" r="8" fill="#F79E1B" />
      <path
        d="M24 9.6c-1.683 1.345-2.76 3.416-2.76 5.76s1.077 4.415 2.76 5.76c1.683-1.345 2.76-3.416 2.76-5.76S25.683 10.945 24 9.6z"
        fill="#FF5F00"
      />
    </PaymentIcon>
  ),
  AMERICAN_EXPRESS: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path
        d="M9.5 12.8l-1.4 3.2h2.8l-1.4-3.2zm19.8 0l-1.4 3.2h2.8l-1.4-3.2zm-14.5 1.9v-1.9h3.8l.9 1 .9-1h10.3v.9l-.4-.9h-2.8l-.5.9-.5-.9H22l-1 2.2v-2.2h-2.6l-.7 1.5-.7-1.5h-4.6v5.8h4.5l.7-1.5.7 1.5h3v-1.4h.4c.5 0 1 0 1.4-.2.5-.1 1-.5 1.3-1 .2-.4.4-.9.4-1.4 0-.3 0-.5-.1-.8-.1-.3-.3-.5-.5-.7-.3-.2-.6-.3-.9-.4-.4 0-.7-.1-1.1-.1h-2.9v1h2.8c.2 0 .5 0 .7.1.3 0 .5.2.6.4.1.2.2.5.2.7 0 .3-.1.5-.2.7-.1.2-.3.4-.6.4-.2.1-.5.1-.7.1h-.9v-3.8h-2.7l-1.2 2.5-1.2-2.5H15v4.8h-2.7l-.7-1.7H8.8l-.7 1.7H5.8L8.5 12h2.7l2.7 6.4v-6.4h3l1.3 2.8 1.2-2.8h3.1zM32 14.7l1.2-2.8h2.6l2.7 6.4h-2.3l-.7-1.7h-2.8l-.7 1.7h-2.3l1.2-2.8 1.1-2.5v6.4h3l.9-1 .9 1h1v-5.8h-2.8l-1 2.2zm-1.2 1.2v-1.2h2.7v1.2h-2.7zm0 1.2h2.7v1.3h-2.7v-1.3z"
        fill="#fff"
      />
    </PaymentIcon>
  ),
  DISCOVER: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#fff" />
      <path
        d="M48 16c0-8.837-7.163-16-16-16v32c8.837 0 16-7.163 16-16z"
        fill="#F47216"
      />
      <path
        d="M6.5 13.5h2.25c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5H6.5v-5zm1.25 4h1c.75 0 1.25-.5 1.25-1.5s-.5-1.5-1.25-1.5h-1v3zm3.5-4h1.25v5H11.25v-5zm3.25 2.5c0 1.5 1 2.5 2.25 2.5.5 0 1-.15 1.5-.5l-.5-1c-.25.25-.5.35-.75.35-.75 0-1.25-.5-1.25-1.35 0-.85.5-1.35 1.25-1.35.25 0 .5.1.75.35l.5-1c-.5-.35-1-.5-1.5-.5-1.25 0-2.25 1-2.25 2.5zm4.5-2.5l1.5 3.5 1.5-3.5h1.5l-2.5 5.5h-.5l-2.5-5.5h1.5zm6.5 0h3.5v1h-2.25v1h2v1h-2v1h2.25v1h-3.5v-5zm4.5 0h2c1 0 1.5.5 1.5 1.25 0 .5-.25.85-.75 1 .5.15.75.5.75 1.25 0 .75-.5 1.5-1.5 1.5h-2v-5zm1.25 2h.75c.25 0 .5-.25.5-.5s-.25-.5-.5-.5h-.75v1zm0 2h.75c.25 0 .5-.25.5-.5s-.25-.5-.5-.5h-.75v1z"
        fill="#000"
      />
    </PaymentIcon>
  ),
  DINERS_CLUB: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#0079BE" />
      <path
        d="M18.5 9C13.806 9 10 12.806 10 17.5S13.806 26 18.5 26 27 22.194 27 17.5 23.194 9 18.5 9zm0 14.4c-3.753 0-6.8-3.047-6.8-6.8s3.047-6.8 6.8-6.8 6.8 3.047 6.8 6.8-3.047 6.8-6.8 6.8zm11 2.6c4.694 0 8.5-3.806 8.5-8.5S34.194 9 29.5 9 21 12.806 21 17.5 24.806 26 29.5 26zm0-14.4c3.753 0 6.8 3.047 6.8 6.8s-3.047 6.8-6.8 6.8-6.8-3.047-6.8-6.8 3.047-6.8 6.8-6.8z"
        fill="#fff"
      />
      <path
        d="M16.5 17.5c0-1.989.732-3.806 1.94-5.2v10.4c-1.208-1.394-1.94-3.211-1.94-5.2zm4 5.2V12.3c1.208 1.394 1.94 3.211 1.94 5.2s-.732 3.806-1.94 5.2zm8.06-5.2c0 1.989-.732 3.806-1.94 5.2V12.3c1.208 1.394 1.94 3.211 1.94 5.2zm4 0c0-1.989-.732-3.806-1.94-5.2v10.4c1.208-1.394 1.94-3.211 1.94-5.2z"
        fill="#fff"
      />
    </PaymentIcon>
  ),
  JCB: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#0E4C96" />
      <path
        d="M38 9h-6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2z"
        fill="#53B947"
      />
      <path
        d="M27 9h-6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2z"
        fill="#D9222A"
      />
      <path
        d="M16 9h-6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2z"
        fill="#0E4C96"
      />
      <path
        d="M13 15.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5v1.25c0 1.105-.895 2-2 2h-2v-1.5h2v-.75h-1v-1zm11-1.5c-.828 0-1.5.672-1.5 1.5v3c0 .828.672 1.5 1.5 1.5h2.5v-1.5H24V16h2.5v-1.5H24v-1.5h3V14h-3zm11 0c-.828 0-1.5.672-1.5 1.5v1.25c0 1.105.895 2 2 2h.5c.828 0 1.5-.672 1.5-1.5v-.25h-1.5v.25h-.5v-1.5h2V15.5c0-.828-.672-1.5-1.5-1.5H35z"
        fill="#fff"
      />
    </PaymentIcon>
  ),
  UNIONPAY: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#002D72" />
      <path
        d="M11.5 11h7l-1 5h-5l-1-5zm7.5 0h7l-1 5h-5l-1-5zm7.5 0h7l-1 5h-5l-1-5zm-15 6h7l-1 5h-5l-1-5zm7.5 0h7l-1 5h-5l-1-5zm7.5 0h7l-1 5h-5l-1-5z"
        fill="#E21836"
      />
      <path
        d="M15 14.5h2l-.25 2h-2l.25-2zm7.5 0h2l-.25 2h-2l.25-2zm7.5 0h2l-.25 2h-2l.25-2z"
        fill="#003D82"
      />
      <path
        d="M13 19.5h2l-.25 2h-2l.25-2zm7.5 0h2l-.25 2h-2l.25-2zm7.5 0h2l-.25 2h-2l.25-2z"
        fill="#009540"
      />
    </PaymentIcon>
  ),
  APPLE_PAY: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#000" />
      <path
        d="M14.5 11.5c-.5.6-.9 1.4-.8 2.2.9.1 1.8-.5 2.3-1.1.5-.6.9-1.4.8-2.2-.9 0-1.8.5-2.3 1.1zm.8 1.3c-1.3-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.7-3.2 1.9-1.3 2.3-.4 5.7 1 7.6.7.9 1.5 2 2.5 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6c1 0 1.8-1 2.5-2 .8-1.1 1.1-2.1 1.1-2.2 0 0-2.1-.8-2.1-3.2 0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-.5 0-1.1.1-1.6.5zm18.7.7h-3.7v6.5h1.2v-2.3h2.5c1.9 0 3.2-1.3 3.2-3.1s-1.3-3.1-3.2-3.1zm0 1h2.5c1.3 0 2 .7 2 2.1s-.7 2.1-2 2.1h-2.5v-4.2zm9.5 1.5c1 0 1.8.8 1.8 2s-.8 2-1.8 2-1.8-.8-1.8-2 .8-2 1.8-2zm-3 4.5h1.2v-.8c.3.5.9.9 1.8.9 1.4 0 2.5-1.1 2.5-2.9s-1.1-2.9-2.5-2.9c-.9 0-1.5.4-1.8.9V13h-1.2v7.5zm-5.5-3.3c.1-1.3.9-2.2 2.1-2.2 1.2 0 2 .9 2 2.2h-4.1zm5.3.6c0-1.8-1-2.9-2.5-2.9s-2.6 1.1-2.6 2.9 1 2.9 2.6 2.9c1.3 0 2.3-.7 2.5-1.7h-1.2c-.2.5-.7.8-1.3.8-.9 0-1.5-.6-1.5-1.6v-.4h5.3c0-.1 0-.1-.3 0z"
        fill="#fff"
      />
    </PaymentIcon>
  ),
  GOOGLE_PAY: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#fff" />
      <path
        d="M23 16.5v3.4h-1.3v-8.8h3.5c.9 0 1.6.3 2.2.9.6.6.9 1.3.9 2.2 0 .9-.3 1.6-.9 2.2-.6.6-1.3.9-2.2.9H23zm0-4.4v3.1h2.2c.5 0 1-.2 1.3-.6.4-.3.6-.8.6-1.3 0-.5-.2-1-.6-1.3-.4-.4-.8-.6-1.3-.6H23z"
        fill="#3C4043"
      />
      <path
        d="M30 14.5c.6 0 1.1.2 1.5.6.4.4.6.9.6 1.5v3.3h-1.3v-.8h-.1c-.4.6-1 .9-1.7.9-.6 0-1-.2-1.4-.5-.4-.3-.6-.7-.6-1.2 0-.5.2-1 .6-1.3.4-.3.9-.5 1.5-.5.6 0 1.1.1 1.5.3v-.2c0-.3-.1-.6-.4-.8-.2-.2-.5-.4-.9-.4-.5 0-.9.2-1.2.6l-1.1-.7c.5-.7 1.2-1 2.2-1zm-1.1 4.3c0 .3.1.5.3.7.2.2.5.3.8.3.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1-.3-.2-.7-.3-1.2-.3-.4 0-.7.1-1 .3-.2.2-.4.4-.4.6z"
        fill="#3C4043"
      />
      <path
        d="M36.5 14.6l-3.3 7.6h-1.4l1.2-2.6-2.2-5h1.5l1.4 3.6h.1l1.4-3.6h1.5z"
        fill="#3C4043"
      />
      <path
        d="M18.4 15.3c0-.4-.3-.7-.9-.7-.4 0-.7.2-.9.5l-1.1-.7c.5-.7 1.2-1 2.1-1 1.3 0 2.2.7 2.2 1.9v3.6h-1.3v-.8h-.1c-.4.6-.9.9-1.7.9-.6 0-1.1-.2-1.5-.6-.4-.4-.6-.9-.6-1.5 0-.6.2-1.1.7-1.5.4-.4 1-.5 1.7-.5.6 0 1.1.1 1.5.4v-.3zm-1.8 1.5c0 .3.1.6.4.8.2.2.5.3.9.3.5 0 .9-.2 1.2-.5.3-.3.5-.7.5-1.2-.3-.3-.8-.4-1.3-.4-.4 0-.8.1-1.1.3-.3.2-.5.5-.5.7z"
        fill="#3C4043"
      />
    </PaymentIcon>
  ),
  SHOP_PAY: (props) => (
    <PaymentIcon {...props}>
      <rect width="48" height="32" rx="4" fill="#5A31F4" />
      <path
        d="M17.5 13c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5S16 15.3 16 14.5s.7-1.5 1.5-1.5zm13 0c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5S29 15.3 29 14.5s.7-1.5 1.5-1.5zM24 11c-3.9 0-7 3.1-7 7 0 .3 0 .6.1.9l-2.9 1.5c-.2-.8-.2-1.6-.2-2.4 0-5.5 4.5-10 10-10s10 4.5 10 10c0 .8-.1 1.6-.2 2.4l-2.9-1.5c.1-.3.1-.6.1-.9 0-3.9-3.1-7-7-7zm0 11c-1.7 0-3.2-.8-4.2-2.1l2.4-1.3c.5.6 1.2.9 1.8.9s1.3-.3 1.8-.9l2.4 1.3c-1 1.3-2.5 2.1-4.2 2.1z"
        fill="#fff"
      />
    </PaymentIcon>
  ),
};

export function Footer() {
  const { shopName, paymentSettings } = useShopMenu();
  const {
    footerWidth,
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
    showVisaIcon,
    showMastercardIcon,
    showAmexIcon,
    showDiscoverIcon,
    showDinersIcon,
    showJcbIcon,
    showUnionpayIcon,
    showApplePayIcon,
    showGooglePayIcon,
    showShopPayIcon,
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

  // Get payment methods from Shopify API
  const apiPaymentMethods = [
    ...(paymentSettings?.acceptedCardBrands || []),
    ...(paymentSettings?.supportedDigitalWallets || []),
  ].filter((method) => PAYMENT_ICON_MAP[method]);

  // Fallback to manual theme settings if API returns empty
  const manualPaymentMethods = [
    showVisaIcon && "VISA",
    showMastercardIcon && "MASTERCARD",
    showAmexIcon && "AMERICAN_EXPRESS",
    showDiscoverIcon && "DISCOVER",
    showDinersIcon && "DINERS_CLUB",
    showJcbIcon && "JCB",
    showUnionpayIcon && "UNIONPAY",
    showApplePayIcon && "APPLE_PAY",
    showGooglePayIcon && "GOOGLE_PAY",
    showShopPayIcon && "SHOP_PAY",
  ].filter(Boolean) as string[];

  // Use API methods if available, otherwise use manual settings
  const acceptedPaymentMethods =
    apiPaymentMethods.length > 0 ? apiPaymentMethods : manualPaymentMethods;

  // Split payment methods into visible and remaining based on max limit (5)
  const MAX_VISIBLE_ICONS = 5;
  const visiblePaymentMethods = acceptedPaymentMethods.slice(
    0,
    MAX_VISIBLE_ICONS,
  );
  const remainingCount = Math.max(
    0,
    acceptedPaymentMethods.length - MAX_VISIBLE_ICONS,
  );

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
              <div className="order-2 flex items-center justify-start gap-3 md:justify-end">
                {acceptedPaymentMethods.length > 0 ? (
                  <>
                    {visiblePaymentMethods.map((method) => {
                      const Icon = PAYMENT_ICON_MAP[method];
                      return Icon ? (
                        <div
                          key={method}
                          className="flex items-center"
                          title={method.replace(/_/g, " ")}
                        >
                          <Icon className="h-8 w-12" />
                        </div>
                      ) : null;
                    })}
                    {remainingCount > 0 && (
                      <div
                        className="flex items-center justify-center font-medium"
                        title={`${remainingCount} more payment method${remainingCount > 1 ? "s" : ""}`}
                      >
                        +{remainingCount}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-body-subtle text-sm">
                    Payment methods available at checkout
                  </p>
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
