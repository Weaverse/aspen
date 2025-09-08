import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import { clsx } from "clsx";
import type { CSSProperties } from "react";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { calculateAspectRatio } from "~/utils/image";

interface CollectionCardProps {
  collection: Collection;
  imageAspectRatio: ImageAspectRatio;
  collectionNameColor: string;
  loading?: HTMLImageElement["loading"];
}

export function CollectionCard({
  collection,
  imageAspectRatio,
  collectionNameColor,
  loading,
}: CollectionCardProps) {
  if (collection.products.nodes.length === 0) {
    return null;
  }

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
  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="relative flex flex-col gap-2"
      style={
        {
          "--aspect-ratio": calculateAspectRatio(
            collection?.image,
            imageAspectRatio,
          ),
        } as CSSProperties
      }
    >
      <div className="group relative flex aspect-(--aspect-ratio) items-center justify-center overflow-hidden">
        {collectionImage ? (
          <Image
            data={collectionImage}
            width={collectionImage.width || 600}
            height={collectionImage.height || 400}
            sizes="(max-width: 32em) 100vw, 45vw"
            loading={loading}
            className={clsx(
              "absolute inset-0 z-0",
              "transition-all duration-300",
            )}
          />
        ) : null}
        <span
          style={{ color: collectionNameColor }}
          className="absolute bottom-0 left-0 z-1 p-4 uppercase"
        >
          {collection.title}
        </span>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
    </Link>
  );
}
