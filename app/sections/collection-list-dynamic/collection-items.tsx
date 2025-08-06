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
        return (
          <div
            key={collection.id + ind}
            className="w-full h-full aspect-[3/4] p-4 bg-(--collection-bg-color) flex flex-col gap-5"
          >
            {collection?.image && (
              <div className="overflow-hidden w-full h-full relative">
                <Image
                  data={collection.image}
                  className={clsx([
                    "h-full w-full object-cover",
                  ])}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            )}
            <Link
              to={`/collections/${collection.handle}`}
              className="flex flex-col gap-1 w-full text-(--collection-name-color)"
            >
              <h3
                className={clsx(
                  "uppercase group-hover:underline font-medium text-lg leading-snug line-clamp-1",
                )}
              >
                {collection.title}
              </h3>
              <p>{collection.products?.nodes?.length || 0} Products</p>
            </Link>
          </div>
        );
      } else {
        return (
          <Link
            key={collection.id + ind}
            to={`/collections/${collection.handle}`}
            className="relative h-full w-full group"
            data-motion="slide-in"
          >
            {collection?.image && (
              <div
                className={clsx(
                  "overflow-hidden w-full h-full",
                  activeLayout === "showcase" ? "aspect-[4/3]" : "aspect-[3/4]",
                )}
              >
                <Image
                  data={collection.image}
                  className={clsx([
                    "h-full w-full object-cover",
                  ])}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            )}

            <h3
              className={clsx(
                "absolute bottom-0 uppercase w-full font-medium text-lg leading-snug line-clamp-1 p-4 bg-(--collection-bg-color) text-(--collection-name-color)",
              )}
            >
              {collection.title}
            </h3>
          </Link>
        );
      }
    };

    // Render different layouts based on the activeLayout
    if (activeLayout === "slider") {
      return (
        <div ref={scope} {...rest} className="w-full">
          <Swiper spaceBetween={gap} slidesPerView={"auto"} className="w-full">
            {collections.map((collection, ind) => (
              <SwiperSlide
                key={collection.id + ind}
                className="relative group max-w-[380px] h-fit"
                data-motion="slide-in"
                style={style}
              >
                {renderCollectionContent(collection)}
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
            <div className="grid md:grid-cols-2 gap-[var(--gap)] mb-10">
              {/* Left column - 2 collections stacked */}
              <div className="flex flex-col gap-[var(--gap)]">
                {firstTwo.map((collection, ind) =>
                  renderCollectionContent(collection, ind),
                )}
              </div>

              {/* Right column - 1 collection full height */}
              <Link
                to={`/collections/${third.handle}`}
                className="h-full group relative"
                data-motion="slide-in"
              >
                {third?.image && (
                  <div className={clsx("overflow-hidden flex-grow")}>
                    <Image
                      data={third.image}
                      width={third.image.width || 600}
                      height={third.image.height || 800}
                      sizes="(max-width: 32em) 100vw, 30vw"
                      className={clsx([
                        "h-full w-full object-cover",
                      ])}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                )}

                <h3
                  className={clsx(
                    "absolute bottom-0 uppercase w-full font-medium text-lg leading-snug line-clamp-1 p-4 bg-(--collection-bg-color) text-(--collection-name-color)",
                  )}
                >
                  {third.title}
                </h3>
              </Link>
            </div>

            {/* Remaining collections in 2-column grid */}
            {remaining.length > 0 && (
              <div className="grid md:grid-cols-2 gap-[var(--gap)]">
                {remaining.map((collection, ind) =>
                  renderCollectionContent(collection, ind),
                )}
              </div>
            )}
          </div>
        );
      } else {
        // Đối với 1-2 collection, hiển thị dạng grid-col-2 đơn giản
        return (
          <div ref={scope} {...rest} className="w-full" style={style}>
            <div className="grid md:grid-cols-2 gap-[var(--gap)]">
              {collections.map((collection, ind) =>
                renderCollectionContent(collection, ind),
              )}
            </div>
          </div>
        );
      }
    }

    // Grid layout
    return (
      <div
        ref={scope}
        {...rest}
        className={clsx(
          "grid grid-cols-2 md:grid-cols-3 gap-[var(--gap)] w-full pb-8",
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
