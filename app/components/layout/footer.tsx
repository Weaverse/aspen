import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  Minus,
  Plus,
  TwitterLogo,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import type React from "react";
import { useEffect, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { useFetcher } from "react-router";
import { Link } from "~/components/link";
import { AspenWordmark } from "~/components/logo";
import { useGlobalThemeText } from "~/hooks/use-global-theme-text";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { RevealUnderline } from "~/reveal-underline";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import {
  hasRichText,
  sanitizeFooterHtml,
} from "~/utils/footer-rich-text";
import { translateError } from "~/utils/translated-error";
import {
  CountrySelector,
  currencySelectorWrapperClassName,
  languageSelectorWrapperClassName,
  localeSelectorGroupClassName,
} from "./country-selector";
import { PAYMENT_ICON_MAP } from "./payment-icons";

type NewsletterResponse = { ok: boolean; error: string };
type FooterLogoData = React.ComponentProps<typeof Image>["data"];

export function Footer() {
  const translateText = useGlobalThemeText();

  const { t } = useTranslation();
  const { shopName, footerMenu, paymentSettings } = useShopMenu();
  const {
    footerLogoData,
    footerLogoWidth = 300,
    footerPaddingMobile = 20,
    footerPaddingTablet = 32,
    footerPaddingDesktop = 40,
    footerSectionSpacing = 56,
    footerColumnGap = 80,
    footerBrandColumnWidth = 460,
    footerNewsletterWidth = 400,
    footerNewsletterHeight = 54,
    footerMenuColumns = "4",
    footerDividerColor = "#3E3E3E",
    footerInputBackground = "#FFFFFF",
    footerInputTextColor = "#343231",
    footerInputBorderColor = "#9D9D9D",
    footerInputPlaceholderColor = "#918379",
    footerSocialIconSize = 20,
    footerFontSize = 14,
    footerLineHeight = 1.55,
    bio:
      rawI18nBio = "<p>Modern furniture designed for living. Built for longevity, crafted with care.</p>",
    copyright:
      rawI18nCopyright = '<p>© 2026 Aspen Theme. <a href="https://www.shopify.com/?utm_campaign=poweredby&utm_medium=shopify&utm_source=onlinestore" target="_blank" rel="noopener noreferrer">Powered by Shopify</a></p>',
    addressTitle: rawI18nAddressTitle = "CONTACT",
    storeAddress:
      rawI18nStoreAddress = "123 Main Street, Suite 200\nLos Angeles, CA, USA, 90015",
    storeEmail: rawI18nStoreEmail = "hello@aspen.com",
    storePhone = "+1 (555) 123-4567",
    businessHoursTitle: rawI18nBusinessHoursTitle = "BUSINESS HOURS",
    businessHoursWeekdays:
      rawI18nBusinessHoursWeekdays = "Monday to Friday, 9:00 AM – 6:00 PM",
    businessHoursWeekend:
      rawI18nBusinessHoursWeekend = "Saturday to Sunday, 10:00 AM – 2:00 PM",
    newsletterTitle: rawI18nNewsletterTitle = "STAY IN TOUCH",
    newsletterDescription:
      rawI18nNewsletterDescription = "News and inspiration in your inbox, every week.",
    newsletterPlaceholder: rawI18nNewsletterPlaceholder = "Enter your email",
    newsletterButtonText: rawI18nNewsletterButtonText = "SEND",
    socialInstagram,
    socialX,
    socialLinkedIn,
    socialFacebook,
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
  const bio = translateText(
    rawI18nBio,
    "themeContent.componentsLayoutFooter.bio",
  );
  const storeEmail = translateText(
    rawI18nStoreEmail,
    "themeContent.componentsLayoutFooter.storeEmail",
  );
  const newsletterButtonText = translateText(
    rawI18nNewsletterButtonText,
    "themeContent.componentsLayoutFooter.newsletterButtonText",
  );
  const newsletterPlaceholder = translateText(
    rawI18nNewsletterPlaceholder,
    "themeContent.componentsLayoutFooter.newsletterPlaceholder",
  );
  const newsletterDescription = translateText(
    rawI18nNewsletterDescription,
    "themeContent.componentsLayoutFooter.newsletterDescription",
  );
  const newsletterTitle = translateText(
    rawI18nNewsletterTitle,
    "themeContent.componentsLayoutFooter.newsletterTitle",
  );
  const businessHoursWeekend = translateText(
    rawI18nBusinessHoursWeekend,
    "themeContent.componentsLayoutFooter.businessHoursWeekend",
  );
  const businessHoursWeekdays = translateText(
    rawI18nBusinessHoursWeekdays,
    "themeContent.componentsLayoutFooter.businessHoursWeekdays",
  );
  const businessHoursTitle = translateText(
    rawI18nBusinessHoursTitle,
    "themeContent.componentsLayoutFooter.businessHoursTitle",
  );
  const storeAddress = translateText(
    rawI18nStoreAddress,
    "themeContent.componentsLayoutFooter.storeAddress",
  );
  const addressTitle = translateText(
    rawI18nAddressTitle,
    "themeContent.componentsLayoutFooter.addressTitle",
  );
  const copyright = translateText(
    rawI18nCopyright,
    "themeContent.componentsLayoutFooter.copyright",
  );
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
  const socialLinks = [
    { name: "Instagram", url: socialInstagram, Icon: InstagramLogo },
    { name: "X", url: socialX, Icon: TwitterLogo },
    { name: "LinkedIn", url: socialLinkedIn, Icon: LinkedinLogo },
    { name: "Facebook", url: socialFacebook, Icon: FacebookLogo },
  ];
  const menuColumns = Number(footerMenuColumns) as 2 | 3 | 4;

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
    <footer
      className="w-full bg-(--color-footer-bg) text-(--color-footer-text) [font-size:var(--footer-font-size)] [line-height:var(--footer-line-height)]"
      style={
        {
          "--footer-padding-mobile": `${footerPaddingMobile}px`,
          "--footer-padding-tablet": `${footerPaddingTablet}px`,
          "--footer-padding-desktop": `${footerPaddingDesktop}px`,
          "--footer-section-spacing": `${footerSectionSpacing}px`,
          "--footer-column-gap": `${footerColumnGap}px`,
          "--footer-brand-column": `${footerBrandColumnWidth}px`,
          "--footer-newsletter-width": `${footerNewsletterWidth}px`,
          "--footer-newsletter-height": `${footerNewsletterHeight}px`,
          "--footer-divider-color": footerDividerColor,
          "--footer-input-bg": footerInputBackground,
          "--footer-input-text": footerInputTextColor,
          "--footer-input-border": footerInputBorderColor,
          "--footer-input-placeholder": footerInputPlaceholderColor,
          "--footer-social-size": `${footerSocialIconSize}px`,
          "--footer-font-size": `${footerFontSize}px`,
          "--footer-line-height": footerLineHeight,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto w-full max-w-(--page-width)">
        <div className="hidden xl:block">
          <div className="grid grid-cols-[minmax(280px,var(--footer-brand-column))_1fr] items-start gap-(--footer-column-gap) border-(--footer-divider-color) border-b [padding:var(--footer-section-spacing)_var(--footer-padding-desktop)]">
            <DesktopBrand
              shopName={shopName}
              logoData={footerLogoData}
              logoWidth={footerLogoWidth}
              bio={bio}
              businessHoursTitle={businessHoursTitle}
              businessHoursWeekdays={businessHoursWeekdays}
              businessHoursWeekend={businessHoursWeekend}
            />
            <FooterMenu items={menuItems} desktopOnly columns={menuColumns} />
          </div>

          <div className="grid grid-cols-2 border-(--footer-divider-color) border-b [padding:var(--footer-section-spacing)_var(--footer-padding-desktop)]">
            <ContactBlock
              title={addressTitle}
              address={storeAddress}
              email={storeEmail}
              phone={storePhone}
            />
            <div className="w-full max-w-(--footer-newsletter-width) justify-self-end">
              <NewsletterSignup {...newsletterProps} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 [padding:calc(var(--footer-section-spacing)*0.57)_var(--footer-padding-desktop)]">
            <div className="flex items-center gap-6">
              <Copyright html={copyright} />
              <SocialLinks links={socialLinks} />
            </div>
            <div className="flex min-w-0 items-center gap-4">
              <LocaleSelectors />
              <PaymentMethods
                methods={visiblePaymentMethods}
                remainingCount={remainingPaymentMethods}
              />
            </div>
          </div>
        </div>

        <div className="hidden [padding:var(--footer-section-spacing)_var(--footer-padding-tablet)] md:block xl:hidden">
          <div className="pb-11">
            <BrandMark
              shopName={shopName}
              logoData={footerLogoData}
              logoWidth={footerLogoWidth}
            />
            <div className="mt-7 grid grid-cols-2 items-start gap-4">
              <CompactBrand
                shopName={shopName}
                logoData={footerLogoData}
                logoWidth={footerLogoWidth}
                businessHoursWeekdays={businessHoursWeekdays}
                address={storeAddress}
                showMark={false}
              />
              <NewsletterSignup {...newsletterProps} />
            </div>
          </div>

          <div className="border-(--footer-divider-color) border-t pt-(--footer-section-spacing)">
            <FooterMenu items={menuItems} desktopOnly columns={menuColumns} />
            <div className="mt-10 flex min-w-0 items-center justify-between gap-6">
              <LocaleSelectors />
              <PaymentMethods
                methods={visiblePaymentMethods}
                remainingCount={remainingPaymentMethods}
              />
            </div>
            <div className="mt-8 flex items-center justify-between gap-6">
              <Copyright html={copyright} />
              <SocialLinks links={socialLinks} />
            </div>
          </div>
        </div>

        <div className="[padding:var(--footer-section-spacing)_var(--footer-padding-mobile)] md:hidden">
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
            <SocialLinks links={socialLinks} />
          </div>
          <div className="mt-8 min-w-0 max-w-full">
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
  const { designSystemPreset } = useThemeSettings();
  const resolvedLogoWidth = Number(logoWidth) || 300;

  if (logoData) {
    return (
      <div className="max-w-full" style={{ width: resolvedLogoWidth }}>
        <Image
          data={logoData}
          sizes={`${resolvedLogoWidth}px`}
          width={1200}
          className="h-auto w-full object-contain object-left brightness-0 invert"
        />
      </div>
    );
  }

  if (designSystemPreset !== "custom") {
    return (
      <div className="max-w-full" style={{ width: resolvedLogoWidth }}>
        <AspenWordmark className="h-auto w-full text-current" />
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
    <div className="flex flex-col gap-4">
      <BrandMark
        shopName={shopName}
        logoData={logoData}
        logoWidth={logoWidth}
      />
      {hasRichText(bio) ? (
        <div
          className="max-w-[320px] font-normal [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: sanitizeFooterHtml(bio) }}
        />
      ) : null}
      <div className="font-normal">
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
  showMark = true,
}: {
  shopName: string;
  logoData?: FooterLogoData;
  logoWidth: number;
  businessHoursWeekdays: string;
  address: string;
  showMark?: boolean;
}) {
  const { t } = useTranslation();
  const { designSystemPreset } = useThemeSettings();
  const brandTitle = designSystemPreset !== "custom" ? "ASPEN" : shopName;
  return (
    <div>
      {showMark ? (
        <BrandMark
          shopName={shopName}
          logoData={logoData}
          logoWidth={logoWidth}
        />
      ) : null}
      <div className={cn(showMark && "mt-7", "max-w-[350px]")}>
        <p className="font-semibold uppercase">{brandTitle}</p>
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

function SocialLinks({
  links,
}: {
  links: Array<{
    name: string;
    url?: string;
    Icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  const { t } = useTranslation();
  const visibleLinks = links.filter(
    (link): link is typeof link & { url: string } => Boolean(link.url?.trim()),
  );

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <nav
      className="flex items-center gap-4"
      aria-label={t("accessibility.socialMedia")}
    >
      {visibleLinks.map(({ name, url, Icon }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          className="transition-opacity hover:opacity-70"
        >
          <Icon className="size-(--footer-social-size)" />
        </a>
      ))}
    </nav>
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
  mobile?: boolean;
}) {
  const { t } = useTranslation();

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
          "flex h-(--footer-newsletter-height) w-full gap-3",
          mobile ? "mt-[17px]" : "mt-3",
        )}
      >
        <input
          name="email"
          type="email"
          required
          aria-label={placeholder}
          placeholder={placeholder}
          className="min-w-0 flex-1 border border-(--footer-input-border) bg-(--footer-input-bg) px-4 text-(--footer-input-text) [font-size:inherit] outline-none placeholder:text-(--footer-input-placeholder) focus-visible:ring-1 focus-visible:ring-current"
        />
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          className="w-[86px] shrink-0 rounded-(--radius-sm) bg-(--btn-primary-bg) font-semibold text-(--btn-primary-text) [font-size:inherit] uppercase transition-colors disabled:cursor-wait disabled:opacity-60 hover:bg-(--btn-secondary-bg) hover:text-(--btn-secondary-text) md:w-[98px]"
        >
          {buttonText}
        </button>
      </fetcher.Form>
      {error || message ? (
        <div className="mt-2 text-xs" aria-live="polite">
          {error ? (
            <p className="text-red-400">{translateError(t, error)}</p>
          ) : null}
          {message ? <p className="text-green-400">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function LocaleSelectors() {
  return (
    <div className={localeSelectorGroupClassName}>
      <CountrySelector
        enableFlag={false}
        wrapperClassName={currencySelectorWrapperClassName}
        inputClassName="min-h-[50px] w-auto max-w-full rounded-none border border-[var(--Border-Border,#9D9D9D)] px-5 py-1 tracking-[0.02em]"
      />
      <CountrySelector
        mode="language"
        enableFlag={false}
        wrapperClassName={languageSelectorWrapperClassName}
        inputClassName="min-h-[50px] w-auto max-w-full rounded-none border border-[var(--Border-Border,#9D9D9D)] px-4 py-1 tracking-[0.02em]"
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
      className="font-normal leading-none xl:whitespace-nowrap [&_a]:font-normal [&_a]:text-inherit [&_a]:underline [&_a]:decoration-solid [&_a]:[text-decoration-skip-ink:none] [&_a]:[text-underline-position:from-font] [&_p]:m-0"
      dangerouslySetInnerHTML={{ __html: sanitizeFooterHtml(html) }}
    />
  );
}

function FooterMenu({
  items,
  desktopOnly = false,
  columns = 4,
}: {
  items: SingleMenuItem[];
  desktopOnly?: boolean;
  columns?: 2 | 3 | 4;
}) {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  if (desktopOnly) {
    return (
      <nav
        aria-label={t("footer.navigation")}
        className={cn(
          "grid w-full gap-6 pt-1 xl:gap-8",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
        )}
      >
        {items.slice(0, columns).map(({ id, to, title, items: subItems }) => (
          <div key={id}>
            <div className="font-semibold uppercase">
              {["#", "/"].includes(to) ? (
                <span>{title}</span>
              ) : (
                <Link to={to}>{title}</Link>
              )}
            </div>
            {subItems?.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {subItems.map((item) => (
                  <Link
                    to={item.to}
                    key={item.id}
                    className="w-fit font-normal !font-normal leading-[inherit] tracking-normal"
                  >
                    <RevealUnderline className="ff-body font-normal [--underline-color:var(--color-footer-text)]">
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

  const mobileItems = items;

  return (
    <Accordion.Root
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="w-full border-(--footer-divider-color) border-t"
    >
      {mobileItems.map(({ id, to, title, items: subItems }) => {
        const hasChildren = Boolean(subItems?.length);
        const isOpen = openItems.includes(id);

        return (
          <Accordion.Item
            key={id}
            value={id}
            className="border-(--footer-divider-color) border-b"
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
                    <Link
                      to={item.to}
                      key={item.id}
                      className="w-fit font-normal"
                    >
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
