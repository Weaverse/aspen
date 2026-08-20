import { Minus, Plus } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import type React from "react";
import { useEffect, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Link, useFetcher } from "react-router";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { RevealUnderline } from "~/reveal-underline";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import { CountrySelector } from "./country-selector";
import { PAYMENT_ICON_MAP } from "./payment-icons";

type NewsletterResponse = { ok: boolean; error: string };
type FooterLogoData = React.ComponentProps<typeof Image>["data"];

export function Footer() {
  const { t } = useTranslation();
  const { shopName, footerMenu, paymentSettings } = useShopMenu();
  const {
    footerWidth = "full",
    footerLogoData,
    footerLogoWidth = 300,
    bio,
    copyright = '© 2025 Aspen Theme. <a href="https://www.shopify.com/?utm_campaign=poweredby&utm_medium=shopify&utm_source=onlinestore">Powered by Shopify</a>',
    addressTitle = "CONTACT",
    storeAddress = "123 Main Street, Suite 200\nLos Angeles, CA, USA, 90015",
    storeEmail = "hello@aspen.com",
    storePhone = "+1 (555) 123-4567",
    businessHoursTitle = "BUSINESS HOURS",
    businessHoursWeekdays = "Monday to Friday, 9:00 AM – 6:00 PM",
    businessHoursWeekend = "Saturday to Sunday, 10:00 AM – 2:00 PM",
    newsletterTitle = "STAY IN TOUCH",
    newsletterDescription = "News and inspiration in your inbox, every week.",
    newsletterPlaceholder = "Enter your email",
    newsletterButtonText = "SEND",
    showVisaIcon,
    showMastercardIcon,
    showAmexIcon,
    showPaypalIcon,
    showDiscoverIcon,
    showDinersIcon,
    showJcbIcon,
    showUnionpayIcon,
    showApplePayIcon,
    showGooglePayIcon,
  } = useThemeSettings();
  const fetcher = useFetcher<NewsletterResponse>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    if (fetcher.data.ok) {
      setError("");
      setMessage(t("footer.newsletterSuccess"));
      return;
    }
    setMessage("");
    setError(fetcher.data.error || t("footer.newsletterError"));
  }, [fetcher.data, t]);

  const apiPaymentMethods = [
    ...(paymentSettings?.acceptedCardBrands || []),
    ...(paymentSettings?.supportedDigitalWallets || []),
  ].filter((method) => PAYMENT_ICON_MAP[method]);
  const manualPaymentMethods = [
    showVisaIcon && "VISA",
    showMastercardIcon && "MASTERCARD",
    showAmexIcon && "AMERICAN_EXPRESS",
    showPaypalIcon && "PAYPAL",
    showDiscoverIcon && "DISCOVER",
    showDinersIcon && "DINERS_CLUB",
    showJcbIcon && "JCB",
    showUnionpayIcon && "UNIONPAY",
    showApplePayIcon && "APPLE_PAY",
    showGooglePayIcon && "GOOGLE_PAY",
  ].filter(Boolean) as string[];
  const acceptedPaymentMethods = Array.from(
    new Set(
      apiPaymentMethods.length ? apiPaymentMethods : manualPaymentMethods,
    ),
  );
  const visiblePaymentMethods = acceptedPaymentMethods.slice(0, 5);
  const remainingPaymentMethods = Math.max(
    acceptedPaymentMethods.length - visiblePaymentMethods.length,
    0,
  );
  const menuItems = (footerMenu?.items || []) as unknown as SingleMenuItem[];
  const contentWidthClass =
    footerWidth === "fixed" ? "mx-auto max-w-(--page-width)" : "";

  const newsletterProps = {
    fetcher,
    title: newsletterTitle,
    description: newsletterDescription,
    placeholder: newsletterPlaceholder,
    buttonText: newsletterButtonText,
    message,
    error,
    onSubmitStart: () => {
      setMessage("");
      setError("");
    },
  };

  return (
    <footer className="w-full bg-(--color-footer-bg) text-(--color-footer-text) text-sm leading-[1.55]">
      <div className={cn("w-full", contentWidthClass)}>
        <div className="hidden lg:block">
          <div className="grid min-h-[338px] grid-cols-[400px_1fr] gap-20 border-[#3E3E3E] border-b px-10 pt-16 pb-12">
            <DesktopBrand
              shopName={shopName}
              logoData={footerLogoData}
              logoWidth={footerLogoWidth}
              bio={bio}
              businessHoursTitle={businessHoursTitle}
              businessHoursWeekdays={businessHoursWeekdays}
              businessHoursWeekend={businessHoursWeekend}
            />
            <FooterMenu items={menuItems} desktopOnly />
          </div>

          <div className="grid min-h-[239px] grid-cols-2 border-[#3E3E3E] border-b px-10 py-14">
            <ContactBlock
              title={addressTitle}
              address={storeAddress}
              email={storeEmail}
              phone={storePhone}
            />
            <div className="w-full max-w-[400px] justify-self-end">
              <NewsletterSignup {...newsletterProps} desktop />
            </div>
          </div>

          <div className="flex min-h-[115px] items-center justify-between gap-8 px-10 py-8">
            <Copyright html={copyright} />
            <div className="flex items-center gap-4">
              <LocaleSelectors />
              <PaymentMethods
                methods={visiblePaymentMethods}
                remainingCount={remainingPaymentMethods}
              />
            </div>
          </div>
        </div>

        <div className="hidden min-h-[729px] px-8 pt-16 pb-12 md:block lg:hidden">
          <div className="grid min-h-[296px] grid-cols-[1fr_1.05fr] gap-12">
            <CompactBrand
              shopName={shopName}
              logoData={footerLogoData}
              logoWidth={footerLogoWidth}
              businessHoursWeekdays={businessHoursWeekdays}
              address={storeAddress}
            />
            <NewsletterSignup {...newsletterProps} />
          </div>

          <div className="border-[#9D9D9D] border-t pt-11">
            <FooterMenu items={menuItems} desktopOnly />
            <div className="mt-10 flex items-center justify-between gap-6">
              <LocaleSelectors />
              <PaymentMethods
                methods={visiblePaymentMethods}
                remainingCount={remainingPaymentMethods}
              />
            </div>
            <div className="mt-8">
              <Copyright html={copyright} />
            </div>
          </div>
        </div>

        <div className="min-h-[940px] px-5 pt-16 pb-[46px] md:hidden">
          <CompactBrand
            shopName={shopName}
            logoData={footerLogoData}
            logoWidth={footerLogoWidth}
            businessHoursWeekdays={businessHoursWeekdays}
            address={storeAddress}
          />
          <div className="mt-10">
            <FooterMenu items={menuItems} />
          </div>
          <div className="mt-[29px]">
            <NewsletterSignup {...newsletterProps} mobile />
          </div>
          <div className="mt-8">
            <LocaleSelectors />
          </div>
          <div className="mt-[38px]">
            <PaymentMethods
              methods={visiblePaymentMethods}
              remainingCount={remainingPaymentMethods}
            />
          </div>
          <div className="mt-10">
            <Copyright html={copyright} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function BrandMark({
  shopName,
  logoData,
  logoWidth,
}: {
  shopName: string;
  logoData?: FooterLogoData;
  logoWidth: number;
}) {
  if (logoData) {
    return (
      <div
        className="max-w-full"
        style={{ width: Math.min(Number(logoWidth) || 300, 300) }}
      >
        <Image
          data={logoData}
          sizes="300px"
          width={600}
          className="h-auto w-full object-contain object-left brightness-0 invert"
        />
      </div>
    );
  }

  return (
    <p className="ff-heading text-[64px] uppercase leading-none tracking-[-0.04em]">
      {shopName}
    </p>
  );
}

function DesktopBrand({
  shopName,
  logoData,
  logoWidth,
  bio,
  businessHoursTitle,
  businessHoursWeekdays,
  businessHoursWeekend,
}: {
  shopName: string;
  logoData?: FooterLogoData;
  logoWidth: number;
  bio?: string;
  businessHoursTitle: string;
  businessHoursWeekdays: string;
  businessHoursWeekend: string;
}) {
  return (
    <div>
      <BrandMark
        shopName={shopName}
        logoData={logoData}
        logoWidth={logoWidth}
      />
      {bio ? (
        <div
          className="mt-7 max-w-[320px] [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
      ) : null}
      <div className="mt-4">
        <p className="font-semibold uppercase">{businessHoursTitle}</p>
        <p>{businessHoursWeekdays}</p>
        <p>{businessHoursWeekend}</p>
      </div>
    </div>
  );
}

function CompactBrand({
  shopName,
  logoData,
  logoWidth,
  businessHoursWeekdays,
  address,
}: {
  shopName: string;
  logoData?: FooterLogoData;
  logoWidth: number;
  businessHoursWeekdays: string;
  address: string;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <BrandMark
        shopName={shopName}
        logoData={logoData}
        logoWidth={logoWidth}
      />
      <div className="mt-7 max-w-[350px]">
        <p className="font-semibold uppercase">{shopName}</p>
        <p>
          {t("footer.businessHours")}: {businessHoursWeekdays}
        </p>
        <p className="whitespace-pre-line">
          {t("footer.address")}: {address}
        </p>
      </div>
    </div>
  );
}

function ContactBlock({
  title,
  address,
  email,
  phone,
}: {
  title: string;
  address: string;
  email: string;
  phone: string;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="font-semibold uppercase">{title}</p>
      <p className="mt-3 whitespace-pre-line">{address}</p>
      <div className="mt-4">
        <p>
          {t("footer.email")}: {email}
        </p>
        <p>
          {t("footer.phone")}: {phone}
        </p>
      </div>
    </div>
  );
}

function NewsletterSignup({
  fetcher,
  title,
  description,
  placeholder,
  buttonText,
  message,
  error,
  onSubmitStart,
  desktop = false,
  mobile = false,
}: {
  fetcher: FetcherWithComponents<NewsletterResponse>;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  message: string;
  error: string;
  onSubmitStart: () => void;
  desktop?: boolean;
  mobile?: boolean;
}) {
  return (
    <div>
      <p className="font-semibold uppercase">{title}</p>
      <p className={mobile ? "mt-[17px]" : "mt-3"}>{description}</p>
      <fetcher.Form
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSubmitStart();
          fetcher.submit(event.currentTarget, {
            action: "/api/klaviyo",
            method: "POST",
            encType: "multipart/form-data",
          });
        }}
        action="/api/klaviyo"
        method="POST"
        encType="multipart/form-data"
        className={clsx(
          "flex h-[54px] w-full gap-3",
          mobile ? "mt-[17px]" : "mt-3",
        )}
      >
        <input
          name="email"
          type="email"
          required
          aria-label={placeholder}
          placeholder={placeholder}
          className={clsx(
            "min-w-0 flex-1 border border-[#9D9D9D] px-4 outline-none placeholder:text-[#918379] focus-visible:ring-1 focus-visible:ring-current",
            desktop
              ? "bg-transparent text-(--color-footer-text)"
              : "bg-white text-[#343231]",
          )}
        />
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          className={clsx(
            "w-[86px] shrink-0 rounded-md font-semibold uppercase transition-colors disabled:cursor-wait disabled:opacity-60 md:w-[98px]",
            "hover:bg-white hover:text-black",
            desktop ? "bg-[#EDEDED] text-[#343231]" : "bg-[#524B46] text-white",
          )}
        >
          {buttonText}
        </button>
      </fetcher.Form>
      {error || message ? (
        <div className="mt-2 text-xs" aria-live="polite">
          {error ? <p className="text-red-400">{error}</p> : null}
          {message ? <p className="text-green-400">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function LocaleSelectors() {
  return (
    <div className="flex items-center gap-2">
      <CountrySelector
        enableFlag={false}
        wrapperClassName="w-[198px]"
        inputClassName="h-[50px] px-5"
      />
      <CountrySelector
        mode="language"
        enableFlag={false}
        wrapperClassName="w-[112px]"
        inputClassName="h-[50px] px-4"
      />
    </div>
  );
}

function PaymentMethods({
  methods,
  remainingCount,
}: {
  methods: string[];
  remainingCount: number;
}) {
  const { t } = useTranslation();
  if (!methods.length) {
    return (
      <p className="text-(--color-footer-text) text-xs opacity-70">
        {t("footer.paymentMethodsAtCheckout")}
      </p>
    );
  }

  return (
    <ul
      className="flex items-center gap-4"
      aria-label={t("footer.acceptedPayments")}
    >
      {methods.map((method) => {
        const Icon = PAYMENT_ICON_MAP[method];
        return Icon ? (
          <li
            key={method}
            className="flex h-6 w-[38px] items-center justify-center overflow-hidden bg-white"
            title={method.replace(/_/g, " ")}
          >
            <Icon className="h-[18px] w-[32px]" />
          </li>
        ) : null;
      })}
      {remainingCount > 0 ? (
        <li
          className="text-xs"
          title={t("footer.morePaymentMethods", { count: remainingCount })}
        >
          +{remainingCount}
        </li>
      ) : null}
    </ul>
  );
}

function Copyright({ html }: { html: string }) {
  return (
    <div
      className="[&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FooterMenu({
  items,
  desktopOnly = false,
}: {
  items: SingleMenuItem[];
  desktopOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  if (desktopOnly) {
    return (
      <nav
        aria-label={t("footer.navigation")}
        className="grid w-full grid-cols-4 gap-8 pt-1"
      >
        {items.slice(0, 4).map(({ id, to, title, items: subItems }) => (
          <div key={id}>
            <div className="font-semibold uppercase">
              {["#", "/"].includes(to) ? (
                <span>{title}</span>
              ) : (
                <Link to={to}>{title}</Link>
              )}
            </div>
            {subItems?.length ? (
              <div className="mt-4 flex flex-col gap-2">
                {subItems.map((item) => (
                  <Link to={item.to} key={item.id} className="w-fit">
                    <RevealUnderline className="ff-body [--underline-color:var(--color-footer-text)]">
                      {item.title}
                    </RevealUnderline>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    );
  }

  const mobileItems = items
    .filter((item) => !item.title.toLowerCase().includes("support"))
    .slice(0, 3);

  return (
    <Accordion.Root
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="w-full border-[#9D9D9D] border-t"
    >
      {mobileItems.map(({ id, to, title, items: subItems }) => {
        const hasChildren = Boolean(subItems?.length);
        const isOpen = openItems.includes(id);

        return (
          <Accordion.Item
            key={id}
            value={id}
            className="border-[#9D9D9D] border-b"
          >
            {hasChildren ? (
              <Accordion.Trigger className="group flex min-h-[61px] w-full items-center justify-between text-left font-medium uppercase">
                <span>{title}</span>
                <span className="relative h-4 w-4" aria-hidden="true">
                  <Plus
                    className={clsx(
                      "absolute h-4 w-4 transition-all duration-200",
                      isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
                    )}
                  />
                  <Minus
                    className={clsx(
                      "absolute h-4 w-4 transition-all duration-200",
                      isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0",
                    )}
                  />
                </span>
              </Accordion.Trigger>
            ) : (
              <div className="flex min-h-[61px] items-center font-medium uppercase">
                {["#", "/"].includes(to) ? (
                  <span>{title}</span>
                ) : (
                  <Link to={to}>{title}</Link>
                )}
              </div>
            )}
            {hasChildren ? (
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
                <div className="flex flex-col gap-3 pb-5">
                  {subItems.map((item) => (
                    <Link to={item.to} key={item.id} className="w-fit">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </Accordion.Content>
            ) : null}
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
