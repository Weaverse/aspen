import { Pagination } from "@shopify/hydrogen";
import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useLoaderData } from "react-router";
import type { CollectionsQuery } from "storefront-api.generated";
import { variants } from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { getImageLoadingPriority } from "~/utils/image";
import { CollectionCard } from "./collection-card";

interface CollectionsItemsProps {
  prevButtonText: string;
  nextButtonText: string;
  imageAspectRatio: ImageAspectRatio;
  collectionNameColor: string;
  gap: number;
}

const CollectionsItems = forwardRef<HTMLDivElement, CollectionsItemsProps>(
  (props, ref) => {
    const { collections } = useLoaderData<CollectionsQuery>();
    const {
      prevButtonText,
      nextButtonText,
      imageAspectRatio,
      collectionNameColor,
      gap = 24,
      ...rest
    } = props;

    const style = {
      "--gap": `${gap}px`,
    } as React.CSSProperties;

    return (
      <div ref={ref} {...rest}>
        <Pagination connection={collections}>
          {({
            nodes,
            isLoading,
            hasPreviousPage,
            hasNextPage,
            NextLink,
            PreviousLink,
          }) => (
            <div className="flex w-full flex-col items-center gap-8">
              {hasPreviousPage && (
                <PreviousLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? "Loading..." : prevButtonText}
                </PreviousLink>
              )}
              <div
                className={cn(
                  "grid w-full grid-cols-2 gap-(--gap) md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3",
                )}
                style={style}
              >
                {nodes.map((collection, i) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection as Collection}
                    imageAspectRatio={imageAspectRatio}
                    collectionNameColor={collectionNameColor}
                    loading={getImageLoadingPriority(i, 2)}
                  />
                ))}
              </div>
              {hasNextPage && (
                <NextLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? "Loading..." : nextButtonText}
                </NextLink>
              )}
            </div>
          )}
        </Pagination>
      </div>
    );
  },
);

export default CollectionsItems;

export const schema = createSchema({
  type: "collections-items",
  title: "Collection items",
  settings: [
    {
      group: "Pagination",
      inputs: [
        {
          type: "text",
          name: "prevButtonText",
          label: "Previous button text",
          defaultValue: "Previous collections",
          placeholder: "Previous collections",
        },
        {
          type: "text",
          name: "nextButtonText",
          label: "Next button text",
          defaultValue: "Next collections",
          placeholder: "Next collections",
        },
      ],
    },
    {
      group: "Collection grid",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Gap between items",
          defaultValue: 24,
          configs: {
            min: 0,
            max: 80,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Collection card",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "3/4",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "color",
          name: "collectionNameColor",
          label: "Collection name color",
          defaultValue: "#fff",
        },
      ],
    },
  ],
});
