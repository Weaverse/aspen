import "@fontsource/tenor-sans/index.css";
import "@fontsource-variable/dm-sans/index.css";
import tenorSansWoff2Url from "@fontsource/tenor-sans/files/tenor-sans-latin-400-normal.woff2?url";
import dmSansVarWoff2Url from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { SeoConfig } from "@shopify/hydrogen";
import { Analytics, getSeoMeta, useNonce } from "@shopify/hydrogen";
import {
  useThemeSettings,
  useTranslation,
  withWeaverse,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import {
  isRouteErrorResponse,
  Links,
  type LinksFunction,
  type LoaderFunctionArgs,
  Meta,
  type MetaArgs,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { CartStoreSync } from "./components/cart/cart-sync";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { ScrollingAnnouncement } from "./components/layout/scrolling-announcement";
import {
  NewsletterPopup,
  useShouldRenderNewsletterPopup,
} from "./components/newsletter-popup";
import { CustomAnalytics } from "./components/root/custom-analytics";
import { GenericError } from "./components/root/generic-error";
import { GlobalLoading } from "./components/root/global-loading";
import { NotFound } from "./components/root/not-found";
import { WishlistProvider } from "./components/wishlist/wishlist-provider";
import styles from "./styles/app.css?url";
import { DEFAULT_LOCALE } from "./utils/const";
import { skipRootRevalidationForStorefrontActions } from "./utils/revalidation";
import { loadCriticalData, loadDeferredData } from "./utils/root.server";
import { GlobalStyle } from "./weaverse/style";

export type RootLoader = typeof loader;

export const shouldRevalidate = skipRootRevalidationForStorefrontActions;

export const links: LinksFunction = () => {
  return [
    {
      rel: "preconnect",
      href: "https://cdn.shopify.com",
    },
    {
      rel: "preconnect",
      href: "https://shop.app",
    },
    // Preload self-hosted fonts emitted by Vite to minimize flash
    {
      rel: "preload",
      href: tenorSansWoff2Url as unknown as string,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: dmSansVarWoff2Url as unknown as string,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    { rel: "icon", type: "image/svg+xml", href: "/favicon.ico" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
  };
}

export const meta = ({ data }: MetaArgs<typeof loader>) => {
  return getSeoMeta(data?.seo as SeoConfig);
};

function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const routeError: { status?: number; data?: any } = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  let pageType = "page";

  if (isRouteError && routeError.status === 404) {
    pageType = routeError.data || pageType;
  }

  return isRouteError ? (
    routeError.status === 404 ? (
      <NotFound type={pageType} />
    ) : (
      <GenericError
        statusCode={routeError.status || 500}
        error={{ message: `${routeError.status} ${routeError.data}` }}
      />
    )
  ) : (
    <GenericError
      error={routeError instanceof Error ? routeError : undefined}
    />
  );
}

function RootLayout({ children }: { children?: React.ReactNode }) {
  const nonce = useNonce();
  const { t } = useTranslation();
  const data = useRouteLoaderData<RootLoader>("root");
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;
  const { designSystemPreset, topbarHeight, topbarText } = useThemeSettings();
  const initialDesktopTopbarHeight =
    designSystemPreset === "custom" ? (topbarHeight ?? 56) : 56;
  const shouldShowNewsletterPopup = useShouldRenderNewsletterPopup();

  return (
    <html
      lang={`${locale.language.toLowerCase()}-${locale.country.toUpperCase()}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={styles} />
        <Meta />
        <Links />
        <GlobalStyle />
      </head>
      <body
        style={
          {
            opacity: 0,
            "--initial-topbar-height-mobile": topbarText ? "44px" : "0px",
            "--initial-topbar-height-desktop": `${
              topbarText ? initialDesktopTopbarHeight : 0
            }px`,
          } as CSSProperties
        }
        className="bg-background text-body antialiased opacity-100! transition-opacity duration-300"
      >
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <CartStoreSync initialCart={data.cart} />
            <WishlistProvider initialWishlist={data.wishlist}>
              <TooltipProvider disableHoverableContent>
                <div
                  className="flex min-h-screen flex-col"
                  key={`${locale.language}-${locale.country}`}
                >
                  <div className="">
                    <a href="#mainContent" className="sr-only">
                      {t("accessibility.skipToContent")}
                    </a>
                  </div>
                  <ScrollingAnnouncement />
                  <Header />
                  <main id="mainContent" className="grow">
                    {children}
                  </main>
                  <Footer />
                </div>
                {shouldShowNewsletterPopup && <NewsletterPopup />}
                <CustomAnalytics />
              </TooltipProvider>
            </WishlistProvider>
          </Analytics.Provider>
        ) : (
          children
        )}
        <GlobalLoading />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export const Layout = withWeaverse(RootLayout);
export default App;
