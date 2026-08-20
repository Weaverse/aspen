import { ArrowRight } from "@phosphor-icons/react";
import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { Image } from "~/components/image";
import { Link } from "~/components/link";

export type CollectionCardLayout = "grid" | "slider" | "showcase";

interface CollectionCardProps {
  collection: Collection;
  layout?: CollectionCardLayout;
  className?: string;
  loading?: HTMLImageElement["loading"];
}

export function CollectionCard({
  collection,
  layout = "grid",
  className,
  loading,
}: CollectionCardProps) {
  let collectionImage = collection.image;
  if (!collectionImage) {
    const collectionProducts = collection.products.nodes;
    if (collectionProducts.length > 0) {
      const firstProduct = collectionProducts[0];
      if (firstProduct.media.nodes.length > 0) {
        const firstProductMedia = firstProduct.media.nodes[0];
        if (firstProductMedia.previewImage) {
          collectionImage = firstProductMedia.previewImage;
        }
      }
    }
  }

  if (layout === "slider") {
    return (
      <Link
        to={`/collections/${collection.handle}`}
        className="group flex h-full w-full flex-col rounded-(--radius-md) bg-(--collection-bg-color) p-4"
      >
        <div className="relative aspect-square w-full overflow-hidden">
          {collectionImage ? (
            <Image
              data={collectionImage}
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 90vw"
              loading={loading}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
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
            {collection.products.nodes.length} Products
          </p>
        </div>
      </Link>
    );
  }

  if (layout === "showcase") {
    return (
      <Link
        to={`/collections/${collection.handle}`}
        className={clsx(
          "group relative block min-h-0 overflow-hidden rounded-(--radius-md)",
          className,
        )}
        data-motion="slide-in"
      >
        {collectionImage ? (
          <Image
            data={collectionImage}
            sizes="(min-width: 768px) 50vw, 100vw"
            loading={loading}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
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
  }

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className={clsx(
        "group relative block aspect-[159.5/249.333] overflow-hidden rounded-(--radius-md) md:aspect-[440/590.2]",
        className,
      )}
      data-motion="slide-in"
    >
      {collectionImage ? (
        <Image
          data={collectionImage}
          sizes="(min-width: 768px) 33vw, 50vw"
          loading={loading}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : null}
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
}
