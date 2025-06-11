import { User } from "@phosphor-icons/react";
import {
  Await,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { Suspense, useState } from "react";
import useWindowScroll from "react-use/esm/useWindowScroll";
import Link from "~/components/link";
import { Logo } from "~/components/logo";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";
import { CartDrawer } from "./cart-drawer";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import { PredictiveSearchButtonMobile } from "./predictive-search/search-mobile";
import { PredictiveSearchButtonDesktop } from "./predictive-search/search-desktop";

let variants = cva("", {
  variants: {
    width: {
      full: "w-full h-full",
      stretch: "w-full h-full",
      fixed: "w-full h-full max-w-(--page-width) mx-auto",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "px-3 md:px-4 lg:px-6 mx-auto",
    },
  },
});

function useIsHomeCheck() {
  let { pathname } = useLocation();
  let rootData = useRouteLoaderData<RootLoader>("root");
  let selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  return pathname.replace(selectedLocale.pathPrefix, "") === "/";
}

export function Header() {
  let [isSearchOpen, setIsSearchOpen] = useState(false);
  let { enableTransparentHeader, headerWidth } = useThemeSettings();
  let isHome = useIsHomeCheck();
  let { y } = useWindowScroll();
  let routeError = useRouteError();

  let scrolled = y >= 50;
  let enableTransparent = enableTransparentHeader && isHome && !routeError;
  let isTransparent = enableTransparent && !scrolled && !isSearchOpen;

  return (
    <header
      className={cn(
        "w-full z-10",
        "transition-all duration-300 ease-in-out",
        "bg-(--color-header-bg) hover:bg-(--color-header-bg)",
        "text-(--color-header-text) hover:text-(--color-header-text)",
        "border-b border-line-subtle",
        variants({ padding: headerWidth }),
        scrolled ? "shadow-header" : "shadow-none",
        enableTransparent
          ? [
              "fixed w-screen group/header",
              "top-(--topbar-height,var(--initial-topbar-height))",
            ]
          : "sticky top-0",
        isTransparent
          ? [
              "bg-transparent border-transparent",
              "text-(--color-transparent-header-text)",
              "[&_.cart-count]:text-(--color-header-text)",
              "[&_.cart-count]:bg-(--color-transparent-header-text)",
              "[&_.main-logo]:opacity-0",
              "[&_.transparent-logo]:opacity-100",
            ]
          : [
              "[&_.cart-count]:text-(--color-header-bg)",
              "[&_.cart-count]:bg-(--color-header-text)",
              "[&_.main-logo]:opacity-100",
              "[&_.transparent-logo]:opacity-0",
            ]
      )}
    >
      <div
        className={cn(
          "h-(--height-nav) py-1.5 lg:py-3 flex items-center justify-between gap-2 lg:gap-8",
          variants({ width: headerWidth })
        )}
      >
        <MobileMenu />
        <PredictiveSearchButtonMobile setIsSearchOpen={setIsSearchOpen} />
        <Logo />
        <DesktopMenu />
        <div className="flex items-center gap-1 z-1">
          <PredictiveSearchButtonDesktop setIsSearchOpen={setIsSearchOpen} />
          <AccountLink className="relative flex items-center justify-center w-8 h-8" />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}

function AccountLink({ className }: { className?: string }) {
  let rootData = useRouteLoaderData<RootLoader>("root");
  let isLoggedIn = rootData?.isLoggedIn;

  return (
    <Suspense fallback="Sign in">
      <Await resolve={isLoggedIn}  errorElement="Sign in">
        {(isLoggedIn) =>
          isLoggedIn ? (
            <Link prefetch="intent" to="/account" className={className}>
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/account/login" className={className}>
              <User className="w-5 h-5" />
            </Link>
          )
        }
      </Await>
    </Suspense>
  );
}
