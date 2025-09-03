import {
  type ComponentLoaderArgs,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  IMAGES_PLACEHOLDERS,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useAnimation } from "~/hooks/use-animation";

// --- Color helpers for randomized per-item background color ---
function seededRandom(seed: number) {
  // Simple LCG for deterministic randomness per index
  let m = 0x80_00_00_00; // 2**31
  let a = 1_103_515_245;
  let c = 12_345;
  let state = (seed >>> 0) % m;
  state = (a * state + c) % m;
  return state / (m - 1);
}

function hexToRgba(hex: string) {
  let clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  let a = 255;
  if (clean.length === 8) {
    a = Number.parseInt(clean.slice(6, 8), 16);
    clean = clean.slice(0, 6);
  }
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return { r, g, b, a: a / 255 };
}

function rgbaToHex({
  r,
  g,
  b,
  a,
}: {
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const alpha = Math.round(a * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha === 255 ? "" : toHex(alpha)}`;
}

function rgbaToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    // biome-ignore lint/style/useDefaultSwitchClause: <explanation>
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgba(h: number, s: number, l: number, a: number) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

function randomizeColor(baseHex: string, seed: number) {
  try {
    const rgba = hexToRgba(baseHex);
    const hsl = rgbaToHsl(rgba.r, rgba.g, rgba.b);

    // Use golden-angle sequence to distribute hues distinctly across items
    const GOLDEN_ANGLE = 137.507_764_05;
    let seqHue = (hsl.h + seed * GOLDEN_ANGLE) % 360; // many unique hues

    // Hue jitter ±20° for organic variety
    const hueJitter = seededRandom(seed + 11) * 40 - 20; // -20..+20
    let newH = (seqHue + hueJitter + 360) % 360;

    // Avoid greenish hues (roughly 90°–150°)
    if (newH >= 90 && newH <= 150) {
      const push = seededRandom(seed + 12) > 0.5 ? 40 : -40; // push towards yellow/orange or blue/purple
      newH = (newH + push + 360) % 360;
    }

    // Saturation: if near gray, bump; else jitter to 60–90 range
    let newS =
      hsl.s < 20
        ? 50 + seededRandom(seed + 13) * 30
        : 60 + seededRandom(seed + 14) * 30; // 50..80 or 60..90
    newS = Math.max(0, Math.min(100, newS));

    // Lightness jitter ±15%
    let newL = Math.max(
      0,
      Math.min(100, hsl.l + (seededRandom(seed + 15) * 30 - 15)),
    );

    // Darken every 3rd item slightly for depth
    if (seed % 3 === 1) {
      newL = Math.max(0, Math.min(100, newL - 10));
    }

    const out = hslToRgba(newH, newS, newL, rgba.a);
    return rgbaToHex(out);
  } catch {
    return baseHex;
  }
}

interface CollectionWithProducts {
  id: string;
  title: string;
  handle: string;
  onlineStoreUrl?: string;
  description?: string;
  image?: {
    id?: string;
    altText?: string | null;
    width?: number;
    height?: number;
    url: string;
  } | null;
  products?: {
    nodes: Array<{
      title: string;
      handle: string;
      featuredImage?: {
        id: string;
        url: string;
        altText?: string | null;
        width: number;
        height: number;
      } | null;
    }>;
  };
}

interface CollectionItemsData {
  collections: WeaverseCollection[];
  layout: "grid" | "slider" | "showcase";
  gap: number;
}

interface CollectionItemsProps
  extends HydrogenComponentProps<CollectionItemsLoaderData>,
    CollectionItemsData {
  collectionNameColor: string;
  collectionBackgroundColor: string;
}

let CollectionItems = forwardRef<HTMLDivElement, CollectionItemsProps>(
  (props, ref) => {
    const [scope] = useAnimation(ref);
    let {
      collectionNameColor,
      collectionBackgroundColor,
      layout = "grid",
      gap = 16,
      loaderData,
      ...rest
    } = props;
    const [activeLayout, setActiveLayout] = useState<
      "grid" | "slider" | "showcase"
    >(layout);

    let collections: CollectionWithProducts[] = loaderData || [];

    useEffect(() => {
      setActiveLayout(layout);
    }, [layout]);

    if (!collections?.length) {
      collections = Array(activeLayout === "showcase" ? 2 : 3).fill(
        COLLECTION_PLACEHOLDER,
      );
    }
    let style = {
      "--collection-name-color": collectionNameColor,
      "--collection-bg-color": collectionBackgroundColor,
      "--gap": `${gap}px`,
    } as React.CSSProperties;
    const renderCollectionContent = (
      collection: CollectionWithProducts,
      ind?: number,
    ) => {
      if (activeLayout === "slider") {
        // Per-item style override for randomized background color
        const randomizedBg =
          typeof ind === "number"
            ? ind === 0
              ? collectionBackgroundColor
              : randomizeColor(collectionBackgroundColor, ind + 1)
            : collectionBackgroundColor;
        const perItemStyle = {
          "--collection-bg-color": randomizedBg,
        } as React.CSSProperties;
        return (
          <div
            key={collection.id + ind}
            className="flex aspect-[3/4] h-full w-full flex-col gap-5 bg-(--collection-bg-color) p-4"
            style={perItemStyle}
          >
            {collection?.image && (
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  data={collection.image}
                  className={clsx(["h-full w-full object-cover"])}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            )}
            <Link
              to={`/collections/${collection.handle}`}
              className="flex w-full flex-col gap-1 text-(--collection-name-color)"
            >
              <h3
                className={clsx(
                  "line-clamp-1 font-medium text-lg uppercase leading-snug group-hover:underline",
                )}
              >
                {collection.title}
              </h3>
              <p>{collection.products?.nodes?.length || 0} Products</p>
            </Link>
          </div>
        );
      }
      return (
        <Link
          key={collection.id + ind}
          to={`/collections/${collection.handle}`}
          className="group relative h-full w-full"
          data-motion="slide-in"
        >
          {collection?.image && (
            <div
              className={clsx(
                "h-full w-full overflow-hidden",
                activeLayout === "showcase" ? "aspect-[4/3]" : "aspect-[3/4]",
              )}
            >
              <Image
                data={collection.image}
                className={clsx(["h-full w-full object-cover"])}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          )}

          <h3
            className={clsx(
              "absolute bottom-0 line-clamp-1 w-full bg-(--collection-bg-color) p-4 font-medium text-(--collection-name-color) text-lg uppercase leading-snug",
            )}
          >
            {collection.title}
          </h3>
        </Link>
      );
    };

    // Render different layouts based on the activeLayout
    if (activeLayout === "slider") {
      return (
        <div ref={scope} {...rest} className="w-full">
          <Swiper spaceBetween={gap} slidesPerView={"auto"} className="w-full">
            {collections.map((collection, ind) => (
              <SwiperSlide
                key={collection.id + ind}
                className="group relative h-fit max-w-[380px]"
                data-motion="slide-in"
                style={style}
              >
                {renderCollectionContent(collection, ind)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      );
    }

    // Showcase layout requires special treatment
    if (activeLayout === "showcase") {
      // Trường hợp đặc biệt cho showcase layout theo thiết kế Figma

      if (collections.length >= 3) {
        // Đối với 3 collection trở lên, hiển thị 2 collection bên trái, 1 bên phải, còn lại ở dưới
        const firstTwo = collections.slice(0, 2);
        const third = collections[2];
        const remaining = collections.length > 3 ? collections.slice(3) : [];

        return (
          <div ref={scope} {...rest} className="w-full" style={style}>
            {/* Main showcase layout - 2 columns */}
            <div className="mb-10 grid gap-[var(--gap)] md:grid-cols-2">
              {/* Left column - 2 collections stacked */}
              <div className="flex flex-col gap-[var(--gap)]">
                {firstTwo.map((collection, ind) =>
                  renderCollectionContent(collection, ind),
                )}
              </div>

              {/* Right column - 1 collection full height */}
              <Link
                to={`/collections/${third.handle}`}
                className="group relative h-full"
                data-motion="slide-in"
              >
                {third?.image && (
                  <div className={clsx("flex-grow overflow-hidden")}>
                    <Image
                      data={third.image}
                      width={third.image.width || 600}
                      height={third.image.height || 800}
                      sizes="(max-width: 32em) 100vw, 30vw"
                      className={clsx(["h-full w-full object-cover"])}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                )}

                <h3
                  className={clsx(
                    "absolute bottom-0 line-clamp-1 w-full bg-(--collection-bg-color) p-4 font-medium text-(--collection-name-color) text-lg uppercase leading-snug",
                  )}
                >
                  {third.title}
                </h3>
              </Link>
            </div>

            {/* Remaining collections in 2-column grid */}
            {remaining.length > 0 && (
              <div className="grid gap-[var(--gap)] md:grid-cols-2">
                {remaining.map((collection, ind) =>
                  renderCollectionContent(collection, ind),
                )}
              </div>
            )}
          </div>
        );
      }
      // Đối với 1-2 collection, hiển thị dạng grid-col-2 đơn giản
      return (
        <div ref={scope} {...rest} className="w-full" style={style}>
          <div className="grid gap-[var(--gap)] md:grid-cols-2">
            {collections.map((collection, ind) =>
              renderCollectionContent(collection, ind),
            )}
          </div>
        </div>
      );
    }

    // Grid layout
    return (
      <div
        ref={scope}
        {...rest}
        className={clsx(
          "grid w-full grid-cols-2 gap-[var(--gap)] pb-8 md:grid-cols-3",
        )}
        style={style}
      >
        {collections.map((collection, ind) => (
          <div key={collection.id + ind}>
            {renderCollectionContent(collection, ind)}
          </div>
        ))}
      </div>
    );
  },
);

let COLLECTION_PLACEHOLDER: CollectionWithProducts = {
  id: "gid://shopify/Collection/1234567890",
  title: "Collection title",
  handle: "collection-handle",
  description: "Collection description",
  image: {
    id: "gid://shopify/CollectionImage/1234567890",
    altText: "Collection thumbnail",
    width: 1000,
    height: 1000,
    url: IMAGES_PLACEHOLDERS.collection_1,
  },
  products: {
    nodes: [],
  },
};

// Set displayName for component reference
CollectionItems.displayName = "CollectionItems";

export default CollectionItems;

// GraphQL query moved from parent component
let COLLECTIONS_QUERY = `#graphql
  query collectionByIds($country: CountryCode, $language: LanguageCode, $ids: [ID!]!)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Collection {
        id
        title
        handle
        onlineStoreUrl
        description
        image {
          id
          altText
          width
          height
          url
        }
        products(first: 3) {
          nodes {
            title
            handle
            featuredImage {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
` as const;

export type CollectionItemsLoaderData = Awaited<ReturnType<typeof loader>>;

export let loader = async ({
  data,
  weaverse,
}: ComponentLoaderArgs<CollectionItemsData>) => {
  let { language, country } = weaverse.storefront.i18n;
  let ids = data.collections?.map(
    (collection) => `gid://shopify/Collection/${collection.id}`,
  );
  if (ids?.length) {
    let { nodes } = await weaverse.storefront.query<CollectionsByIdsQuery>(
      COLLECTIONS_QUERY,
      {
        variables: {
          country,
          language,
          ids,
        },
      },
    );
    return nodes.filter(Boolean);
  }
  return [];
};

export let schema: HydrogenComponentSchema = {
  type: "collection-list-dynamic-items",
  title: "Collection items",
  inspector: [
    {
      group: "Collection List",
      inputs: [
        {
          type: "collection-list",
          name: "collections",
          label: "Collections",
        },
        {
          type: "select",
          name: "layout",
          label: "Layout",
          configs: {
            options: [
              { value: "grid", label: "Grid" },
              { value: "slider", label: "Slider" },
              { value: "showcase", label: "Showcase" },
            ],
          },
          defaultValue: "grid",
        },
        {
          type: "range",
          name: "gap",
          label: "Gap between items",
          configs: {
            min: 8,
            max: 80,
            step: 4,
          },
          defaultValue: 16,
        },
      ],
    },
    {
      group: "Collection card",
      inputs: [
        {
          type: "color",
          name: "collectionNameColor",
          label: "Collection name color",
          defaultValue: "#fff",
        },
        {
          type: "color",
          name: "collectionBackgroundColor",
          label: "Collection background color",
          defaultValue: "#CABDB7E5",
        },
      ],
    },
  ],
};
