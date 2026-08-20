import { ArrowRight } from "@phosphor-icons/react";
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
import type { CollectionByIdsQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useAnimation } from "~/hooks/use-animation";

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
        id?: string;
        url: string;
        altText?: string | null;
        width?: number;
        height?: number;
      } | null;
    }>;
  };
}

interface CollectionItemsData {
  collections: WeaverseCollection[];
  layout: "grid" | "slider" | "showcase";
  gap: number;
  desktopGap?: number;
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
      desktopGap = 20,
      loaderData,
      ...rest
    } = props;
    const [activeLayout, setActiveLayout] = useState<
      "grid" | "slider" | "showcase"
    >(layout);
    const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);

    let collections: CollectionWithProducts[] = loaderData || [];

    useEffect(() => {
      setActiveLayout(layout);
      setIsSwiperInitialized(false);
    }, [layout]);
    useEffect(() => {
      if (activeLayout === "slider" && !isSwiperInitialized) {
        const fallbackTimer = setTimeout(() => {
          setIsSwiperInitialized(true);
        }, 500);
        return () => clearTimeout(fallbackTimer);
      }
    }, [activeLayout, isSwiperInitialized]);

    const requiredCollectionCount =
      activeLayout === "grid" ? 6 : activeLayout === "showcase" ? 3 : 0;

    if (!collections?.length) {
      collections = COLLECTION_PLACEHOLDERS.slice(
        0,
        activeLayout === "slider" ? 4 : requiredCollectionCount,
      );
    } else if (
      requiredCollectionCount > 0 &&
      collections.length < requiredCollectionCount
    ) {
      collections = [
        ...collections,
        ...COLLECTION_PLACEHOLDERS.slice(
          collections.length,
          requiredCollectionCount,
        ),
      ];
    }
    let style = {
      "--collection-name-color": collectionNameColor,
      "--collection-bg-color": collectionBackgroundColor,
      "--gap-mobile": `${gap}px`,
      "--gap-desktop": `${desktopGap}px`,
    } as React.CSSProperties;
    const sliderStyle = {
      ...style,
      width:
        "calc(100vw - max(0px, (100vw - var(--page-width)) / 2) - var(--page-padding))",
    } as React.CSSProperties;
    const renderGridCard = (
      collection: CollectionWithProducts,
      ind: number,
    ) => (
      <Link
        key={collection.id + ind}
        to={`/collections/${collection.handle}`}
        className="group relative block aspect-[159.5/249.333] overflow-hidden rounded-(--radius-md) md:aspect-[440/590.2]"
        data-motion="slide-in"
      >
        {collection.image && (
          <Image
            data={collection.image}
            sizes="(min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/30" />
        <h3 className="absolute inset-0 flex items-center justify-center gap-2 overflow-hidden px-3 text-center font-heading font-normal text-base text-(--collection-name-color) uppercase leading-5 tracking-[-0.025em] md:px-5 md:text-[26px] md:leading-8">
          {/* Left padding mirrors the arrow's width so the title stays centered in both states */}
          <span className="line-clamp-1 whitespace-nowrap pl-7 md:pl-8">
            {collection.title}
          </span>
          <ArrowRight
            weight="thin"
            className="size-5 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:size-6"
          />
        </h3>
      </Link>
    );

    const renderSliderCard = (
      collection: CollectionWithProducts,
      ind: number,
    ) => (
      <Link
        key={collection.id + ind}
        to={`/collections/${collection.handle}`}
        className="group flex h-full w-full flex-col rounded-(--radius-md) bg-(--collection-bg-color) p-4"
      >
        <div className="relative aspect-square w-full overflow-hidden">
          {collection.image && (
            <Image
              data={collection.image}
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 90vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
        </div>
        <div className="flex w-full flex-col pt-5 text-(--collection-name-color)">
          <h3 className="flex items-center gap-2 font-body font-normal text-base leading-6 md:text-xl md:leading-7">
            <span className="line-clamp-1">{collection.title}</span>
            <ArrowRight
              weight="thin"
              className="size-4 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:size-5"
            />
          </h3>
          <p className="font-body text-[10px] leading-4 opacity-75 md:text-xs md:leading-[18px]">
            {collection.products?.nodes?.length || 0} Products
          </p>
        </div>
      </Link>
    );

    const renderEditorialCard = (
      collection: CollectionWithProducts,
      ind: number,
      className?: string,
    ) => (
      <Link
        key={collection.id + ind}
        to={`/collections/${collection.handle}`}
        className={clsx(
          "group relative block min-h-0 overflow-hidden rounded-(--radius-md)",
          className,
        )}
        data-motion="slide-in"
      >
        {collection.image && (
          <Image
            data={collection.image}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
        <h3 className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-[#CABDB7E5] px-4 py-2.5 text-left font-heading font-normal text-sm text-white uppercase leading-5 md:bg-[#6B6B6BE5] md:px-5 md:py-3 md:text-[32px] md:leading-10">
          <span className="line-clamp-1">{collection.title}</span>
          <ArrowRight
            weight="thin"
            className="size-4 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:size-7"
          />
        </h3>
      </Link>
    );

    if (activeLayout === "slider") {
      return (
        <div ref={scope} {...rest} style={sliderStyle}>
          <Swiper
            spaceBetween={gap}
            slidesPerView={1.104}
            breakpoints={{
              768: {
                slidesPerView: 2.2,
                spaceBetween: desktopGap,
              },
              1024: {
                slidesPerView: 2.7,
                spaceBetween: desktopGap,
              },
              1280: {
                slidesPerView: 3.38,
                spaceBetween: desktopGap,
              },
            }}
            onSwiper={() => {
              requestAnimationFrame(() => {
                setIsSwiperInitialized(true);
              });
            }}
            className={clsx(
              "w-full transition-opacity duration-300 [&_.swiper-wrapper]:items-stretch",
              isSwiperInitialized ? "opacity-100" : "opacity-0",
            )}
          >
            {collections.map((collection, ind) => (
              <SwiperSlide
                key={collection.id + ind}
                className="group relative h-auto"
                data-motion="slide-in"
                style={style}
              >
                {renderSliderCard(collection, ind)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      );
    }

    if (activeLayout === "showcase") {
      const editorialCollections = collections.slice(0, 3);
      const firstTwo = editorialCollections.slice(0, 2);
      const third = editorialCollections[2];

      return (
        <div ref={scope} {...rest} className="w-full" style={style}>
          <div className="grid grid-cols-2 items-stretch gap-[var(--gap-mobile)] md:gap-[var(--gap-desktop)]">
            <div className="flex min-h-0 flex-col gap-[var(--gap-mobile)] md:gap-[var(--gap-desktop)]">
              {firstTwo.map((collection, ind) =>
                renderEditorialCard(
                  collection,
                  ind,
                  "aspect-[159.5/140.25] md:aspect-[670/504]",
                ),
              )}
            </div>
            {third && renderEditorialCard(third, 2, "h-full")}
          </div>
        </div>
      );
    }
    return (
      <div
        ref={scope}
        {...rest}
        className={clsx(
          "grid w-full grid-cols-2 gap-[var(--gap-mobile)] md:grid-cols-3 md:gap-[var(--gap-desktop)]",
        )}
        style={style}
      >
        {collections
          .slice(0, 6)
          .map((collection, ind) => renderGridCard(collection, ind))}
      </div>
    );
  },
);

const COLLECTION_PLACEHOLDERS: CollectionWithProducts[] = [
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Outdoor",
  "Workspace",
  "Lighting",
].map((title, index) => ({
  id: `gid://shopify/Collection/placeholder-${index + 1}`,
  title,
  handle: "all",
  description: `${title} collection`,
  image: {
    id: `gid://shopify/CollectionImage/placeholder-${index + 1}`,
    altText: `${title} collection thumbnail`,
    width: 1000,
    height: 1000,
    url: IMAGES_PLACEHOLDERS[
      `collection_${index + 1}` as keyof typeof IMAGES_PLACEHOLDERS
    ],
  },
  products: {
    nodes: [],
  },
}));
CollectionItems.displayName = "CollectionItems";

export default CollectionItems;
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
  let ids = data.collections
    ?.slice(0, 6)
    .map((collection) => `gid://shopify/Collection/${collection.id}`);
  if (ids?.length) {
    let { nodes } = await weaverse.storefront.query<CollectionByIdsQuery>(
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
  settings: [
    {
      group: "Collection List",
      inputs: [
        {
          type: "collection-list",
          name: "collections",
          label: "Collections",
          shouldRevalidate: true,
        },
        {
          type: "select",
          name: "layout",
          label: "Layout",
          helpText:
            "Grid always shows 6 cards. Editorial showcase always shows 3 cards.",
          configs: {
            options: [
              { value: "grid", label: "Grid — 6 cards" },
              { value: "slider", label: "Card slider" },
              { value: "showcase", label: "Editorial showcase" },
            ],
          },
          defaultValue: "grid",
        },
        {
          type: "range",
          name: "gap",
          label: "Mobile gap",
          configs: {
            min: 8,
            max: 80,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
        {
          type: "range",
          name: "desktopGap",
          label: "Desktop gap",
          configs: {
            min: 8,
            max: 80,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
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
          defaultValue: "#7F7866",
        },
      ],
    },
  ],
  presets: {
    layout: "grid",
    gap: 16,
    desktopGap: 20,
    collectionNameColor: "#FEF4EB",
    collectionBackgroundColor: "#7F7866",
  },
};
