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

    if (!collections?.length) {
      collections = new Array(activeLayout === "showcase" ? 2 : 3).fill(
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
        return (
          <Link
            to={`/collections/${collection.handle}`}
            key={collection.id + ind}
            className="flex aspect-[3/4] h-full w-full flex-col gap-5 bg-(--collection-bg-color) p-4"
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
            <div className="flex w-full flex-col gap-1 text-(--collection-name-color)">
              <h3
                className={clsx(
                  "line-clamp-1 font-medium text-lg uppercase leading-snug group-hover:underline",
                )}
              >
                {collection.title}
              </h3>
              <p>{collection.products?.nodes?.length || 0} Products</p>
            </div>
          </Link>
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

    if (activeLayout === "slider") {
      return (
        <div ref={scope} {...rest} className="w-full">
          <Swiper
            spaceBetween={gap}
            slidesPerView={1.2}
            breakpoints={{
              640: {
                slidesPerView: 2.2,
              },
              1024: {
                slidesPerView: 3.2,
              },
              1280: {
                slidesPerView: 3.5,
              },
            }}
            onSwiper={() => {
              requestAnimationFrame(() => {
                  setIsSwiperInitialized(true);
              });
            }}
            className={clsx(
              "w-full transition-opacity duration-300",
              isSwiperInitialized ? "opacity-100" : "opacity-0",
            )}
          >
            {collections.map((collection, ind) => (
              <SwiperSlide
                key={collection.id + ind}
                className="group relative h-fit"
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

    if (activeLayout === "showcase") {
      if (collections.length >= 3) {
        const firstTwo = collections.slice(0, 2);
        const third = collections[2];
        const remaining = collections.length > 3 ? collections.slice(3) : [];

        return (
          <div ref={scope} {...rest} className="w-full" style={style}>
            <div className="mb-10 grid gap-[var(--gap)] md:grid-cols-2">
              <div className="flex flex-col gap-[var(--gap)]">
                {firstTwo.map((collection, ind) =>
                  renderCollectionContent(collection, ind),
                )}
              </div>
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
          defaultValue: "#7F7866",
        },
      ],
    },
  ],
};
