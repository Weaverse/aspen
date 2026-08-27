import { Pagination } from "@shopify/hydrogen";
import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import { createSchema, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { CollectionsQuery } from "storefront-api.generated";
import { variants } from "~/components/link";
import { useAnimation } from "~/hooks/use-animation";
import { cn } from "~/utils/cn";
import { getImageLoadingPriority } from "~/utils/image";
import { CollectionCard, type CollectionCardLayout } from "./collection-card";

interface CollectionsItemsProps {
  prevButtonText: string;
  nextButtonText: string;
  layout: CollectionCardLayout;
  collectionNameColor: string;
  collectionBackgroundColor: string;
  gap: number;
  desktopGap?: number;
  /** Legacy settings kept here so existing Weaverse instances upgrade cleanly. */
  imageAspectRatio?: string;
  enableOverlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
}

const CollectionsItems = forwardRef<HTMLDivElement, CollectionsItemsProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const [scope] = useAnimation(ref);
    const { collections } = useLoaderData<CollectionsQuery>();
    const {
      prevButtonText,
      nextButtonText,
      layout = "grid",
      collectionNameColor = "#FEF4EB",
      collectionBackgroundColor = "#7F7866",
      gap = 16,
      desktopGap = 20,
      imageAspectRatio: _imageAspectRatio,
      enableOverlay: _enableOverlay,
      overlayColor: _overlayColor,
      overlayOpacity: _overlayOpacity,
      ...rest
    } = props;
    const [activeLayout, setActiveLayout] =
      useState<CollectionCardLayout>(layout);
    const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);

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

    const style = {
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

    return (
      <div ref={scope} {...rest}>
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
                  {isLoading ? t("system.loading") : prevButtonText}
                </PreviousLink>
              )}
              {activeLayout === "slider" ? (
                <div className="w-full" style={sliderStyle}>
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
                    {nodes.map((collection, i) => (
                      <SwiperSlide
                        key={collection.id}
                        className="group relative h-auto"
                        data-motion="slide-in"
                        style={style}
                      >
                        <CollectionCard
                          collection={collection as Collection}
                          layout="slider"
                          loading={getImageLoadingPriority(i, 2)}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : activeLayout === "showcase" ? (
                <div
                  className="grid w-full grid-cols-2 items-stretch gap-[var(--gap-mobile)] md:gap-[var(--gap-desktop)]"
                  style={style}
                >
                  <div className="flex min-h-0 flex-col gap-[var(--gap-mobile)] md:gap-[var(--gap-desktop)]">
                    {nodes.slice(0, 2).map((collection, i) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection as Collection}
                        layout="showcase"
                        className="aspect-[159.5/140.25] md:aspect-[670/504]"
                        loading={getImageLoadingPriority(i, 2)}
                      />
                    ))}
                  </div>
                  {nodes[2] ? (
                    <CollectionCard
                      collection={nodes[2] as Collection}
                      layout="showcase"
                      className="h-full"
                      loading={getImageLoadingPriority(2, 2)}
                    />
                  ) : null}
                </div>
              ) : (
                <div
                  className="grid w-full grid-cols-2 gap-[var(--gap-mobile)] md:grid-cols-3 md:gap-[var(--gap-desktop)]"
                  style={style}
                >
                  {nodes.slice(0, 6).map((collection, i) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection as Collection}
                      layout="grid"
                      loading={getImageLoadingPriority(i, 2)}
                    />
                  ))}
                </div>
              )}
              {hasNextPage && (
                <NextLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? t("system.loading") : nextButtonText}
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
      group: "Collection layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout",
          helpText:
            "Grid shows up to 6 cards. Editorial showcase shows up to 3 cards.",
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
          defaultValue: 16,
          configs: {
            min: 8,
            max: 80,
            step: 4,
            unit: "px",
          },
        },
        {
          type: "range",
          name: "desktopGap",
          label: "Desktop gap",
          defaultValue: 20,
          configs: {
            min: 8,
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
});
