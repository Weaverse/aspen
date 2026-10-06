import {
  createSchema,
  type HydrogenComponentProps,
  type InspectorGroup,
  useParentInstance,
  useThemeSettings,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import {
  Link as RemixLink,
  type LinkProps as RemixLinkProps,
  useRouteLoaderData,
} from "react-router";
import { useTranslatedText } from "~/hooks/use-translated-text";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { prefixPathWithLocale } from "~/utils/locale";

const STYLE_2_DEFAULT_COLORS = {
  background: "#514A45",
  text: "#FFFFFF",
  border: "#514A45",
  backgroundHover: "#403A36",
  textHover: "#FFFFFF",
  borderHover: "#403A36",
} as const;

export const variants = cva(["button inline-flex transition-colors"], {
  variants: {
    variant: {
      primary: [
        "px-4 py-3",
        "text-(--btn-primary-text)",
        "bg-(--btn-primary-bg)",
        "hover:text-(--btn-primary-text-hover)",
        "hover:bg-(--btn-primary-bg-hover)",
      ],
      secondary: [
        "px-4 py-3",
        "text-(--btn-secondary-text)",
        "bg-(--btn-secondary-bg)",
        "hover:text-(--btn-secondary-text-hover)",
        "hover:bg-(--btn-secondary-bg-hover)",
      ],
      outline: [
        "border px-4 py-3",
        "text-(--btn-outline-text)",
        "bg-transparent",
        "border-(--btn-outline-border)",
        "hover:text-(--btn-outline-text-hover)",
        "hover:bg-(--btn-outline-background-hover)",
        "hover:border-(--btn-outline-border-hover)",
      ],
      decor: [
        "border-none bg-transparent p-0",
        "group inline-flex items-center gap-1 text-(--btn-text-decor)",
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
        "after:absolute after:bottom-0.5 after:left-0 after:h-px after:w-full after:bg-body",
        "after:origin-right after:scale-x-100 after:transition-transform",
        "hover:after:origin-left hover:after:animate-underline-toggle",
      ],
    },
  },
});

export interface LinkStyles {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  backgroundColorHover: string;
  textColorHover: string;
  borderColorHover: string;
  textColorDecor: string;
}

export interface LinkData
  extends RemixLinkProps,
    Partial<LinkStyles>,
    VariantProps<typeof variants> {
  text?: string;
  style2Text?: string;
  openInNewTab?: boolean;
  alignment?: "left" | "center" | "right";
  style2Alignment?: "left" | "center" | "right";
  style2BackgroundColor?: string;
  style2TextColor?: string;
  style2BorderColor?: string;
  style2BackgroundColorHover?: string;
  style2TextColorHover?: string;
  style2BorderColorHover?: string;
}

export interface LinkProps
  extends HTMLAttributes<HTMLAnchorElement>,
    Partial<Omit<HydrogenComponentProps, "children">>,
    LinkData {}

export function useHrefWithLocale(href: LinkProps["to"]) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale;

  return typeof href === "string" && selectedLocale
    ? prefixPathWithLocale(href, selectedLocale)
    : href;
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
export const Link = forwardRef(
  (props: LinkProps, ref: React.Ref<HTMLAnchorElement>) => {
    const translateText = useTranslatedText();

    let {
      to,
      text: rawI18nText,
      style2Text: rawI18nStyle2Text,
      variant,
      openInNewTab,
      alignment,
      style2Alignment,
      className,
      style,
      textColor,
      backgroundColor,
      borderColor,
      textColorHover,
      backgroundColorHover,
      borderColorHover,
      textColorDecor,
      style2BackgroundColor = STYLE_2_DEFAULT_COLORS.background,
      style2TextColor = STYLE_2_DEFAULT_COLORS.text,
      style2BorderColor = STYLE_2_DEFAULT_COLORS.border,
      style2BackgroundColorHover = STYLE_2_DEFAULT_COLORS.backgroundHover,
      style2TextColorHover = STYLE_2_DEFAULT_COLORS.textHover,
      style2BorderColorHover = STYLE_2_DEFAULT_COLORS.borderHover,
      children,
      ...rest
    } = props;
    const style2Text = translateText(
      rawI18nStyle2Text,
      "themeContent.sectionsCountdownButton.style2Text",
    );
    const text = translateText(
      rawI18nText,
      "themeContent.sectionsCountdownButton.text",
    );
    const { enableViewTransition } = useThemeSettings();
    const parent = useParentInstance();
    const isStyle2 = parent?.data?.scenario === "scenario2";
    const href = useHrefWithLocale(to);
    const effectiveText = isStyle2 && style2Text ? style2Text : text;
    const effectiveAlignment = isStyle2
      ? style2Alignment || alignment || "center"
      : alignment || "left";

    if (variant === "custom") {
      style = {
        ...style,
        "--btn-text": isStyle2 ? style2TextColor : textColor,
        "--btn-bg": isStyle2 ? style2BackgroundColor : backgroundColor,
        "--btn-border": isStyle2 ? style2BorderColor : borderColor,
        "--btn-bg-hover": isStyle2
          ? style2BackgroundColorHover
          : backgroundColorHover,
        "--btn-text-hover": isStyle2 ? style2TextColorHover : textColorHover,
        "--btn-border-hover": isStyle2
          ? style2BorderColorHover
          : borderColorHover,
      } as React.CSSProperties;
    }
    if (variant === "decor") {
      style = {
        ...style,
        "--btn-text-decor": textColorDecor,
      } as React.CSSProperties;
    }

    if (!(effectiveText || children)) {
      return null;
    }

    const alignmentClasses = cn(
      "flex w-full",
      effectiveAlignment === "left" && "justify-start",
      effectiveAlignment === "center" && "justify-center",
      effectiveAlignment === "right" && "justify-end",
    );
    const isTextVariant = variant === "decor" || variant === "underline";

    return (
      <div className={cn("button-countdown", alignmentClasses)}>
        <RemixLink
          ref={ref}
          viewTransition={enableViewTransition}
          to={href}
          style={
            isStyle2
              ? style
              : {
                  ...style,
                  alignItems: "center",
                  justifyContent: "center",
                }
          }
          target={openInNewTab ? "_blank" : undefined}
          className={cn(
            variants({ variant }),
            !isTextVariant && "rounded-(--radius-sm)",
            !(isStyle2 || isTextVariant) &&
              "min-h-[54px] w-fit min-w-[159px] items-center justify-center whitespace-nowrap px-6 py-4 text-sm font-medium leading-none",
            isStyle2 && !isTextVariant && "px-5 py-3 text-xs",
            className,
          )}
          {...rest}
        >
          {variant === "decor" ? (
            <span className="inline-flex items-center gap-2.5">
              {children || effectiveText}
              <span className="transform transition-transform duration-300 group-hover:translate-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M14.0575 4.74121L13.1737 5.62508L16.9236 9.37496H0.625V10.625H16.9234L13.1737 14.3748L14.0575 15.2586L19.3163 9.99992L14.0575 4.74121Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </span>
          ) : (
            children || effectiveText
          )}
        </RemixLink>
      </div>
    );
  },
);

export default Link;

export const linkContentInputs: InspectorGroup["inputs"] = [
  {
    type: "text",
    name: "text",
    label: "Text content",
    defaultValue: "Shop now",
    placeholder: "Shop now",
  },
  {
    type: "text",
    name: "style2Text",
    label: "Style 2 text",
    defaultValue: "Shop Now",
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
    condition: (data: LinkData) => Boolean(data.to),
  },
  {
    type: "select",
    name: "variant",
    label: "Variant",
    configs: {
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
        { label: "Decoration", value: "decor" },
        { label: "Underline", value: "underline" },
        { label: "Custom styles", value: "custom" },
      ],
    },
    defaultValue: "primary",
  },
  {
    type: "toggle-group",
    name: "alignment",
    label: "Style 1 alignment",
    configs: {
      options: [
        { value: "left", label: "Left", icon: "align-start-vertical" },
        { value: "center", label: "Center", icon: "align-center-vertical" },
        { value: "right", label: "Right", icon: "align-end-vertical" },
      ],
    },
    defaultValue: "left",
  },
  {
    type: "toggle-group",
    name: "style2Alignment",
    label: "Style 2 alignment",
    configs: {
      options: [
        { value: "left", label: "Left", icon: "align-start-vertical" },
        { value: "center", label: "Center", icon: "align-center-vertical" },
        { value: "right", label: "Right", icon: "align-end-vertical" },
      ],
    },
    defaultValue: "center",
  },
  {
    type: "color",
    name: "textColorDecor",
    label: "Text color decor",
    defaultValue: "#fff",
    condition: "variant.eq.decor",
  },
];
export const linkStylesInputs: InspectorGroup["inputs"] = [
  {
    type: "color",
    label: "Background color",
    name: "backgroundColor",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color",
    name: "textColor",
    defaultValue: "#fff",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color",
    name: "borderColor",
    defaultValue: "#00000000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Background color (hover)",
    name: "backgroundColorHover",
    defaultValue: "#00000000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color (hover)",
    name: "textColorHover",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color (hover)",
    name: "borderColorHover",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
];

export const style2LinkStylesInputs: InspectorGroup["inputs"] = [
  {
    type: "color",
    label: "Style 2 background color",
    name: "style2BackgroundColor",
    defaultValue: STYLE_2_DEFAULT_COLORS.background,
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Style 2 text color",
    name: "style2TextColor",
    defaultValue: STYLE_2_DEFAULT_COLORS.text,
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Style 2 border color",
    name: "style2BorderColor",
    defaultValue: STYLE_2_DEFAULT_COLORS.border,
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Style 2 background color (hover)",
    name: "style2BackgroundColorHover",
    defaultValue: STYLE_2_DEFAULT_COLORS.backgroundHover,
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Style 2 text color (hover)",
    name: "style2TextColorHover",
    defaultValue: STYLE_2_DEFAULT_COLORS.textHover,
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Style 2 border color (hover)",
    name: "style2BorderColorHover",
    defaultValue: STYLE_2_DEFAULT_COLORS.borderHover,
    condition: (data: LinkData) => data.variant === "custom",
  },
];

export const linkInputs: InspectorGroup["inputs"] = [
  ...linkContentInputs,
  {
    type: "heading",
    label: "Button custom styles",
  },
  ...linkStylesInputs,
  {
    type: "heading",
    label: "Style 2 custom styles",
  },
  ...style2LinkStylesInputs,
];

export const schema = createSchema({
  type: "button--countdown",
  title: "Button",
  settings: [
    {
      group: "Button",
      inputs: linkInputs,
    },
  ],
});
