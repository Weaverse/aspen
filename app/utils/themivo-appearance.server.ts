import {
  THEMIVO_STOREFRONT_ORIGIN,
  type ThemivoCardPosition,
} from "./themivo-script-preview";
import { THEMIVO_TRANSLATION_KEYS } from "./themivo-translations";

type AppearanceConfig = {
  list?: {
    mode?: string;
    layout?: string;
    layoutSwitch?: boolean;
    showPrice?: boolean;
    showAddToCart?: boolean;
    showShare?: boolean;
    shareChannels?: unknown;
    empty?: {
      showIcon?: boolean;
      showButton?: boolean;
      buttonUrl?: string;
      imageUrl?: string;
      collectionId?: string;
      suggestions?: number;
    };
  };
  features?: {
    guestWishlist?: boolean;
    saveForLater?: boolean;
    multipleLists?: boolean;
    sharing?: boolean;
    collaborators?: boolean;
  };
  toast?: { enabled?: boolean; position?: string };
  header?: { showCount?: boolean };
  launcher?: { enabled?: boolean; position?: string };
  style?: {
    icon?: string;
    customIconSvg?: string;
    accent?: string;
    preset?: string;
    radius?: number;
    size?: string;
  };
  productButton?: {
    enabled?: boolean;
    placement?: string;
    position?: string;
    display?: string;
    fullWidth?: boolean;
    showCount?: boolean;
    perVariant?: boolean;
  };
  cardButton?: { enabled?: boolean; position?: string; showOnHover?: boolean };
};

function position(value: string | undefined): ThemivoCardPosition {
  return value === "top-left" ||
    value === "bottom-left" ||
    value === "bottom-right"
    ? value
    : "top-right";
}

function boundedNumber(value: number | undefined, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : null;
}

function internalPath(value: string | undefined) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }
  const base = "https://storefront.invalid";
  const url = new URL(value, base);
  return url.origin === base ? url.pathname + url.search + url.hash : null;
}

function imageUrl(value: string | undefined) {
  if (typeof value !== "string" || !value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return internalPath(value);
  }
}

const SOCIAL_CHANNELS = [
  "facebook",
  "x",
  "pinterest",
  "whatsapp",
  "telegram",
  "email",
] as const;

function normalizeAppearance(config: AppearanceConfig) {
  const icon = config.style?.icon;
  const svg = config.style?.customIconSvg;
  const mode = config.list?.mode;
  const style = config.style;
  const preset = style?.preset;
  const size = style?.size;
  const display = config.productButton?.display;
  const collection = config.list?.empty?.collectionId;
  const channels = config.list?.shareChannels;
  const collectionId =
    typeof collection === "string"
      ? /^(?:gid:\/\/shopify\/Collection\/)?(\d+)$/.exec(collection)?.[1]
      : undefined;
  return {
    wishlistMode: mode === "drawer" || mode === "popup" ? mode : "page",
    wishlistLayout: config.list?.layout === "list" ? "list" : "grid",
    allowLayoutSwitch: config.list?.layoutSwitch === true,
    showPrice: config.list?.showPrice !== false,
    showAddToCart: config.list?.showAddToCart !== false,
    showShare:
      config.list?.showShare !== false && config.features?.sharing !== false,
    saveForLater: config.features?.saveForLater === true,
    productShowCount: config.productButton?.showCount === true,
    productPerVariant: config.productButton?.perVariant === true,
    shareChannels: Array.isArray(channels)
      ? SOCIAL_CHANNELS.filter((channel) => channels.includes(channel))
      : [],
    emptyImageUrl: imageUrl(config.list?.empty?.imageUrl),
    emptyCollectionId: collectionId
      ? `gid://shopify/Collection/${collectionId}`
      : null,
    emptySuggestions: Math.floor(
      boundedNumber(config.list?.empty?.suggestions, 0, 12) ?? 4,
    ),
    guestWishlist: config.features?.guestWishlist !== false,
    emptyShowIcon: config.list?.empty?.showIcon === true,
    emptyShowButton: config.list?.empty?.showButton === true,
    emptyButtonPath: internalPath(config.list?.empty?.buttonUrl),
    toastPosition:
      config.toast?.enabled === true
        ? config.toast.position === "top"
          ? "top"
          : "bottom"
        : null,
    multipleLists: config.features?.multipleLists !== false,
    collaborators: config.features?.collaborators !== false,
    showHeaderCount: config.header?.showCount !== false,
    launcherPosition:
      config.launcher?.enabled === true
        ? position(config.launcher.position)
        : null,
    buttonPreset:
      preset === "minimal" || preset === "soft" || preset === "bold"
        ? preset
        : null,
    accent:
      typeof style?.accent === "string" && /^#[0-9a-f]{6}$/i.test(style.accent)
        ? style.accent
        : null,
    buttonRadius: boundedNumber(style?.radius, 0, 999),
    buttonSize: size === "sm" || size === "md" || size === "lg" ? size : null,
    productDisplay:
      display === "text" || display === "icon_text" ? display : "icon",
    productFullWidth: config.productButton?.fullWidth === true,
    icon:
      icon === "heart" ||
      icon === "star" ||
      icon === "bookmark" ||
      icon === "custom"
        ? icon
        : null,
    // Render as an image so browser SVG image restrictions apply.
    customIcon:
      icon === "custom" &&
      typeof svg === "string" &&
      svg.length <= 8192 &&
      /^\s*<svg[\s>]/i.test(svg)
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        : null,
    productEnabled:
      typeof config.productButton?.enabled === "boolean"
        ? config.productButton.enabled
        : undefined,
    productPlacement:
      config.productButton?.placement === "image" ? "image" : "form",
    productPosition: position(config.productButton?.position),
    cardEnabled:
      typeof config.cardButton?.enabled === "boolean"
        ? config.cardButton.enabled
        : undefined,
    cardPosition: position(config.cardButton?.position),
    cardShowOnHover: config.cardButton?.showOnHover === true,
  } as const;
}

async function fetchAppearance(url: URL, origin: string) {
  try {
    const response = await fetch(url, {
      headers: { Origin: origin, "Cache-Control": "no-cache" },
      redirect: "manual",
      signal: AbortSignal.timeout(1500),
    });
    if (response.ok) {
      const { config, i18n } = (await response.json()) as {
        config?: AppearanceConfig;
        i18n?: Record<string, unknown>;
      };
      if (config && typeof config === "object") {
        const translations: Record<string, string> = {};
        for (const key of Object.values(THEMIVO_TRANSLATION_KEYS)) {
          const value = i18n?.[key];
          if (
            typeof value === "string" &&
            value.trim() &&
            value.length <= 500
          ) {
            translations[key] = value;
          }
        }
        return { ...normalizeAppearance(config), translations };
      }
    }
  } catch {
    // Keep the Aspen buttons available when the public config cannot be loaded.
  }
  return null;
}

const appearanceCache = new Map<
  string,
  {
    expires: number;
    value: NonNullable<Awaited<ReturnType<typeof fetchAppearance>>>;
  }
>();

export async function readThemivoAppearance(
  shop: string,
  origin: string,
  locale?: { language: string; country: string },
) {
  const language =
    locale &&
    `${locale.language.toLowerCase()}-${locale.country.toUpperCase()}`;
  const key = `${shop}|${origin}|${language ?? ""}`;
  const now = Date.now();
  const cached = appearanceCache.get(key);
  if (cached && now < cached.expires) {
    return cached.value;
  }

  const url = new URL(
    `/storefront/v1/shops/${encodeURIComponent(shop)}/config`,
    THEMIVO_STOREFRONT_ORIGIN,
  );
  if (language) {
    url.searchParams.set("locale", language);
  }
  const value = await fetchAppearance(url, origin);
  if (!value) {
    return null;
  }

  appearanceCache.delete(key);
  if (appearanceCache.size >= 32) {
    const oldest = appearanceCache.keys().next();
    if (!oldest.done) {
      appearanceCache.delete(oldest.value);
    }
  }
  appearanceCache.set(key, { expires: Date.now() + 30_000, value });
  return value;
}
