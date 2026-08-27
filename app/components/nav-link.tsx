import { useThemeSettings } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import {
  NavLink as RemixNavLink,
  type NavLinkProps as RemixNavLinkProps,
  useRouteLoaderData,
} from "react-router";
import type { RootLoader } from "~/root";
import { prefixPathWithLocale } from "~/utils/locale";

export const NavLink = forwardRef(
  (props: RemixNavLinkProps, ref: React.Ref<HTMLAnchorElement>) => {
    const { to, className, ...rest } = props;
    const rootData = useRouteLoaderData<RootLoader>("root");
    const { enableViewTransition } = useThemeSettings();
    const selectedLocale = rootData?.selectedLocale;

    const toWithLocale =
      typeof to === "string" && selectedLocale
        ? prefixPathWithLocale(to, selectedLocale)
        : to;

    return (
      <RemixNavLink
        ref={ref}
        viewTransition={enableViewTransition}
        to={toWithLocale}
        className={className}
        {...rest}
      />
    );
  },
);
