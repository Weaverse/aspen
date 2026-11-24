import { useThemeSettings } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import {
  NavLink as RemixNavLink,
  type NavLinkProps as RemixNavLinkProps,
  useRouteLoaderData,
} from "react-router";
import type { RootLoader } from "~/root";
import { prefixPathWithLocale } from "~/utils/locale";
import { preserveThemivoPreview } from "~/utils/themivo-script-preview";

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
    const href =
      rootData?.themivoScriptShop && typeof toWithLocale === "string"
        ? preserveThemivoPreview(toWithLocale)
        : toWithLocale;

    return (
      <RemixNavLink
        ref={ref}
        viewTransition={enableViewTransition}
        to={href}
        className={className}
        {...rest}
      />
    );
  },
);
