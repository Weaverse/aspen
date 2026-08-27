import { UserIcon } from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { Suspense, useState } from "react";
import {
  Await,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import useWindowScroll from "react-use/esm/useWindowScroll";
import Link from "~/components/link";
import { Logo } from "~/components/logo";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";
import { stripLocalePrefix } from "~/utils/locale";
import { CartDrawer } from "./cart-drawer";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import { PredictiveSearchButtonDesktop } from "./predictive-search/search-desktop";
import { PredictiveSearchButtonMobile } from "./predictive-search/search-mobile";

const variants = cva("", {
  variants: {
    width: {
      full: "h-(--height-nav) w-full",
      stretch: "h-(--height-nav) w-full",
      fixed: "mx-auto h-(--height-nav) w-full max-w-[1360px]",
    },
    padding: {
      full: "",
      stretch: "px-4 md:px-8 xl:px-10",
      fixed: "mx-auto px-4 md:px-8 xl:px-10",
    },
  },
});

function useIsHomeCheck() {
  const { pathname } = useLocation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  return stripLocalePrefix(pathname) === "/";
}

export function Header() {
  let [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    designSystemPreset,
    enableTransparentHeader,
    headerLayout = "inline",
    headerWidth,
  } = useThemeSettings();
  const isHome = useIsHomeCheck();
  const { y } = useWindowScroll();
  const routeError = useRouteError();

  const scrolled = y >= 50;
  const isCompactDesktop = headerLayout === "compact";
  const enableTransparent =
    designSystemPreset === "custom" &&
    enableTransparentHeader &&
    isHome &&
    !routeError;
  const isTransparent = enableTransparent && !scrolled && !isSearchOpen;

  return (
    <header
      className={cn(
        "z-10 w-full",
        "transition-all duration-300 ease-in-out",
        "bg-(--color-header-bg) hover:bg-(--color-header-bg-hover)",
        "text-(--color-header-text) hover:text-(--color-header-text)",
        "border-line-subtle border-b",
        variants({ padding: headerWidth }),
        scrolled ? "shadow-none" : "shadow-none",
        enableTransparent
          ? [
              "group/header fixed w-screen",
              "top-(--topbar-height,var(--initial-topbar-height))",
            ]
          : "sticky top-0",
        isTransparent
          ? [
              "border-transparent bg-transparent",
              "text-(--color-transparent-header-text)",
              "[&_.cart-count]:text-(--color-header-text)",
              "[&_.cart-count]:bg-(--color-transparent-header-text)",
              "hover:[&_.cart-count]:bg-(--color-header-text)",
              "hover:[&_.cart-count]:text-(--color-transparent-header-text)",
              "[&_.main-logo]:opacity-0",
              "[&_.transparent-logo]:opacity-100",
            ]
          : [
              "[&_.cart-count]:text-(--color-header-bg)",
              "[&_.cart-count]:bg-(--color-header-text)",
              "[&_.main-logo]:opacity-100",
              "[&_.transparent-logo]:opacity-0",
            ],
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[1fr_auto_1fr] items-center",
          variants({ width: headerWidth }),
        )}
      >
        <div
          className={cn(
            "col-start-1 row-start-1 flex items-center gap-4 justify-self-start",
            !isCompactDesktop && "xl:hidden",
          )}
        >
          <MobileMenu showOnDesktop={isCompactDesktop} />
          <PredictiveSearchButtonMobile setIsSearchOpen={setIsSearchOpen} />
          {isCompactDesktop ? (
            <PredictiveSearchButtonDesktop setIsSearchOpen={setIsSearchOpen} />
          ) : null}
        </div>

        <div
          className={cn(
            "col-start-2 row-start-1 justify-self-center",
            !isCompactDesktop && "xl:col-start-1 xl:justify-self-start",
          )}
        >
          <Logo />
        </div>

        {!isCompactDesktop ? (
          <div className="col-start-2 row-start-1 hidden h-full justify-self-center xl:block">
            <DesktopMenu />
          </div>
        ) : null}

        <div className="z-1 col-start-3 row-start-1 flex items-center gap-4 justify-self-end">
          {!isCompactDesktop ? (
            <PredictiveSearchButtonDesktop setIsSearchOpen={setIsSearchOpen} />
          ) : null}
          <AccountLink className="relative flex size-5 items-center justify-center before:absolute before:-inset-2" />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}

function AccountLink({ className }: { className?: string }) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={clsx("transition-none", className)}>
      <Suspense fallback={<UserIcon className="size-5" />}>
        <Await
          resolve={isLoggedIn}
          errorElement={<UserIcon className="size-5" />}
        >
          {(loggedIn) =>
            loggedIn ? (
              <UserIcon className="size-5" />
            ) : (
              <UserIcon className="size-5" />
            )
          }
        </Await>
      </Suspense>
    </Link>
  );
}
