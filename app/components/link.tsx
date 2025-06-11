import { ArrowRight } from "@phosphor-icons/react";
import {
  createSchema,
  type HydrogenComponentProps,
  type InspectorGroup,
  useThemeSettings,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import {
  Link as RemixLink,
  type LinkProps as RemixLinkProps,
  useRouteLoaderData,
} from "react-router";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";

let variants = cva(["button transition-colors inline-flex"], {
  variants: {
    variant: {
      primary: [
        "px-4 py-3",
        "text-(--btn-primary-text)",
        "bg-(--btn-primary-bg)",
        "border-(--btn-primary-bg)",
        "hover:text-(--btn-primary-bg)",
        "hover:bg-(--btn-primary-text)",
        "hover:border-(--btn-primary-bg)",
      ],
      secondary: [
        "px-4 py-3",
        "text-(--btn-secondary-text)",
        "bg-(--btn-secondary-bg)",
        "border-(--btn-secondary-bg)",
        "hover:bg-(--btn-secondary-text)",
        "hover:text-(--btn-secondary-bg)",
        "hover:border-(--btn-secondary-text)",
      ],
      outline: [
        "border px-4 py-3",
        "text-(--btn-outline-text)",
        "bg-transparent",
        "border-(--btn-outline-border)",
        "hover:bg-(--btn-outline-background)",
        "hover:text-background",
        "hover:border-(--btn-outline-text)",
      ],
      decor: [
        "bg-transparent border-none p-0",
        "text-[--btn-text-decor] inline-flex items-center gap-1 group",
      ],
      custom: [
        "border px-4 py-3",
        "text-(--btn-text)",
        "bg-(--btn-bg)",
        "border-(--btn-border)",
        "hover:text-(--btn-text-hover)",
        "hover:bg-(--btn-bg-hover)",
        "hover:border-(--btn-border-hover)",
      ],
      underline: [
        "relative bg-transparent pb-1 text-body",
        "after:bg-body after:absolute after:left-0 after:bottom-0.5 after:w-full after:h-px",
        "after:scale-x-100 after:transition-transform after:origin-right",
        "hover:after:origin-left hover:after:animate-underline-toggle",
      ],
    },
  },
});

export interface LinkStyleProps {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  backgroundColorHover: string;
  textColorHover: string;
  borderColorHover: string;
  textColorDecor: string;
}

export interface LinkProps
  extends RemixLinkProps,
    VariantProps<typeof variants>,
    HTMLAttributes<HTMLAnchorElement>,
    Partial<Omit<HydrogenComponentProps, "children">>,
    Partial<LinkStyleProps> {
  text?: string;
  openInNewTab?: boolean;
}

export function useHrefWithLocale(href: LinkProps["to"]) {
  let rootData = useRouteLoaderData<RootLoader>("root");
  let selectedLocale = rootData?.selectedLocale;

  let toWithLocale = href;
  if (typeof toWithLocale === "string" && selectedLocale?.pathPrefix) {
    if (!toWithLocale.toLowerCase().startsWith(selectedLocale.pathPrefix)) {
      toWithLocale = `${selectedLocale.pathPrefix}${href}`;
    }
  }

  return toWithLocale;
}

/**
 * In our app, we've chosen to wrap Remix's `Link` component to add
 * helper functionality. If the `to` value is a string (not object syntax),
 * we prefix the locale to the path if there is one.
 *
 * You could implement the same behavior throughout your app using the
 * Remix-native nested routes. However, your route and component structure
 * changes the level of nesting required to get the locale into the route,
 * which may not be ideal for shared components or layouts.
 *
 * Likewise, your internationalization strategy may not require a locale
 * in the pathname and instead rely on a domain, cookie, or header.
 *
 * Ultimately, it is up to you to decide how to implement this behavior.
 */
export let Link = forwardRef(
  (props: LinkProps, ref: React.Ref<HTMLAnchorElement>) => {
    let {
      to,
      text,
      variant,
      openInNewTab,
      className,
      style,
      textColor,
      backgroundColor,
      borderColor,
      textColorHover,
      backgroundColorHover,
      borderColorHover,
      textColorDecor,
      children,
      ...rest
    } = props;
    let { enableViewTransition } = useThemeSettings();
    let href = useHrefWithLocale(to);

    if (variant === "custom") {
      style = {
        ...style,
        "--btn-text": textColor,
        "--btn-bg": backgroundColor,
        "--btn-border": borderColor,
        "--btn-bg-hover": backgroundColorHover,
        "--btn-text-hover": textColorHover,
        "--btn-border-hover": borderColorHover,
        
      } as React.CSSProperties;
    }
    if (variant === "decor") {
      style = {
        ...style,
        "--btn-text-decor": textColorDecor,
      } as React.CSSProperties;
    }

    if (!text && !children) {
      return null;
    }

    return (
      <RemixLink
        ref={ref}
        viewTransition={enableViewTransition}
        to={href}
        style={style}
        target={openInNewTab ? "_blank" : undefined}
        className={cn(variants({ variant, className }))}
        {...rest}
      >
        {variant === "decor" ? (
          <span className="inline-flex items-center gap-1">
            {children || text}
            <ArrowRight
              size={20}
              weight="thin"
              className="transition-transform duration-300 transform group-hover:translate-x-1"
            />
          </span>
        ) : (
          children || text
        )}
      </RemixLink>
    );
  }
);

export default Link;

export let linkContentInputs: InspectorGroup["inputs"] = [
  {
    type: "text",
    name: "text",
    label: "Text content",
    defaultValue: "Shop now",
    placeholder: "Shop now",
  },
  {
    type: "url",
    name: "to",
    label: "Link to",
    defaultValue: "/products",
    placeholder: "/products",
  },
  {
    type: "switch",
    name: "openInNewTab",
    label: "Open in new tab",
    defaultValue: false,
    condition: (data) => !!data.to,
  },
  {
    type: "select",
    name: "variant",
    label: "Variant",
    configs: {
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline-solid" },
        { label: "Decoration", value: "decor" },
        { label: "Underline", value: "underline" },
        { label: "Custom styles", value: "custom" },
      ],
    },
    defaultValue: "primary",
  },
  {
    type: "color",
    name: "textColorDecor",
    label: "Text color decor",
    defaultValue: "#fff",
    condition: "variant.eq.decor",
  },
];
export let linkStylesInputs: InspectorGroup["inputs"] = [
  {
    type: "color",
    label: "Background color",
    name: "backgroundColor",
    defaultValue: "#000",
    condition: (data) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color",
    name: "textColor",
    defaultValue: "#fff",
    condition: (data) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color",
    name: "borderColor",
    defaultValue: "#00000000",
    condition: (data) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Background color (hover)",
    name: "backgroundColorHover",
    defaultValue: "#00000000",
    condition: (data) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color (hover)",
    name: "textColorHover",
    defaultValue: "#000",
    condition: (data) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color (hover)",
    name: "borderColorHover",
    defaultValue: "#000",
    condition: (data) => data.variant === "custom",
  },
];

export let linkInputs: InspectorGroup["inputs"] = [
  ...linkContentInputs,
  {
    type: "heading",
    label: "Button custom styles",
  },
  ...linkStylesInputs,
];

export let schema = createSchema({
  type: "button",
  title: "Button",
  settings: [
    {
      group: "Button",
      inputs: linkInputs,
    },
  ],
});
