import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { localizedSeoMeta } from "~/utils/seo-translation";
import "@fontsource/tenor-sans/index.css";
import "@fontsource-variable/dm-sans/index.css";
import tenorSansWoff2Url from "@fontsource/tenor-sans/files/tenor-sans-latin-400-normal.woff2?url";
import dmSansVarWoff2Url from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { CartReturn, SeoConfig } from "@shopify/hydrogen";
import { Analytics, useNonce } from "@shopify/hydrogen";
import { useTranslation, withWeaverse } from "@weaverse/hydrogen";
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
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import {
  hasThemivoGuest,
  themivoEnabled,
} from "~/utils/themivo-wishlist.server";
import { CartStoreSync } from "./components/cart/cart-sync";
import { useCartStore } from "./components/cart/store";
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
import { ThemivoWishlistEntry } from "./components/wishlist/themivo-wishlist-entry";
import { WishlistProvider } from "./components/wishlist/wishlist-provider";
import styles from "./styles/app.css?url";
import { DEFAULT_LOCALE } from "./utils/const";
import { prefixPathWithLocale } from "./utils/locale";
import { skipRootRevalidationForStorefrontActions } from "./utils/revalidation";
import { loadCriticalData, loadDeferredData } from "./utils/root.server";
import { readThemivoAppearance } from "./utils/themivo-appearance.server";
import {
  isPrivateWishlistPath,
  isThemivoScriptPreview,
  THEMIVO_PREVIEW_WISHLIST_PATH,
  THEMIVO_STOREFRONT_ORIGIN,
} from "./utils/themivo-script-preview";
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
  const url = new URL(args.request.url);
  const themivoScriptShop = isThemivoScriptPreview(url)
    ? args.context.env.PUBLIC_STORE_DOMAIN
    : null;
  const usesThemivo = themivoEnabled(args.context);
  const appearanceShop = usesThemivo
    ? args.context.env.PUBLIC_STORE_DOMAIN
    : themivoScriptShop;
  const [criticalData, themivoAppearance] = await Promise.all([
    loadCriticalData(args),
    appearanceShop
      ? readThemivoAppearance(
          appearanceShop,
          url.origin,
          args.context.storefront.i18n,
        )
      : null,
  ]);

  // A successful guest merge mutates the session before the response is committed.
  const wishlist =
    usesThemivo &&
    hasThemivoGuest(args.context) &&
    (await deferredData.isLoggedIn.catch(() => false))
      ? await deferredData.wishlist
      : deferredData.wishlist;

  return {
    ...deferredData,
    wishlist,
    ...criticalData,
    themivoScriptShop,
    themivoAppearance,
    usesThemivo,
  };
}

export const meta = ({ data, matches }: MetaArgs<typeof loader>) => {
  return localizedSeoMeta(matches, data?.seo as SeoConfig);
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
  const privateWishlist = isPrivateWishlistPath(useLocation().pathname);
  const { designSystemPreset, topbarHeight, topbarText } =
    useTranslatedThemeSettings();
  const initialDesktopTopbarHeight =
    designSystemPreset === "custom" ? (topbarHeight ?? 56) : 56;
  const shouldShowNewsletterPopup = useShouldRenderNewsletterPopup();
  const serverCart = useCartStore((state) => state.serverCart);
  const cartResolved = useCartStore((state) => state.isResolved);

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
            cart={cartResolved ? (serverCart as CartReturn) : data.cart}
            shop={data.shop}
            consent={data.consent}
            canTrack={privateWishlist ? () => false : undefined}
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
                <ThemivoWishlistEntry floating />
                {shouldShowNewsletterPopup && <NewsletterPopup />}
                {!privateWishlist && <CustomAnalytics />}
              </TooltipProvider>
            </WishlistProvider>
          </Analytics.Provider>
        ) : (
          children
        )}
        <GlobalLoading />
        <ScrollRestoration nonce={nonce} />
        {data?.themivoScriptShop && (
          <script
            nonce={nonce}
            type="module"
            src={`${THEMIVO_STOREFRONT_ORIGIN}/storefront/v1/wishlist.js`}
            data-wishlist-shop={data.themivoScriptShop}
            data-storefront-token={data.consent.storefrontAccessToken}
            data-wishlist-url={prefixPathWithLocale(
              THEMIVO_PREVIEW_WISHLIST_PATH,
              locale,
            )}
          />
        )}
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export const Layout = withWeaverse(RootLayout);
export default App;
