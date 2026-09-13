import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { forwardRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { QuickShop } from "~/components/product/quick-shop";
import { ScrollArea } from "~/components/scroll-area";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { isDesktopWidth } from "~/utils/breakpoints";
import { FloatingHotspot } from "./floating-hotspot";
import { ProductPopup } from "./product-popup";

export interface HotspotsItemData {
  iconSize: number;
  offsetX: number;
  offsetY: number;
  product: WeaverseProduct;
  showPrice: boolean;
  showViewDetailsLink: boolean;
  viewDetailsLinkText: string;
}

interface HotspotsItemProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    HotspotsItemData {
  portalPopup?: boolean;
}

// Matches the "Tag" marker component in Figma (node 364:16957): a 34x34
// circle with a 1px white border and a centered 6x6 white dot, wrapped in
// an always-on 42x42 pulse ring, with a white/30% fill added on hover.
function HotspotMarker({ size }: { size: number }) {
  const ringInset = -(42 - size) / 2;
  return (
    <span className="relative inline-flex items-center justify-center">
      <span
        className="absolute animate-ping rounded-full bg-white/30"
        style={{
          inset: ringInset,
          animationDuration: "1500ms",
        }}
      />
      <span
        className="relative flex items-center justify-center rounded-full border border-white bg-transparent transition-colors duration-300 group-hover:bg-white/30"
        style={{ width: size, height: size }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    </span>
  );
}

const HotspotsItem = forwardRef<HTMLDivElement, HotspotsItemProps>(
  (props, ref) => {
    const translateText = useTranslatedText();

    const { t } = useTranslation();
    const {
      portalPopup = false,
      iconSize,
      offsetX,
      offsetY,
      product,
      showPrice,
      showViewDetailsLink,
      viewDetailsLinkText: rawI18nViewDetailsLinkText,
      children,
      loaderData,
      ...rest
    } = props;
    const viewDetailsLinkText = translateText(
      rawI18nViewDetailsLinkText,
      "themeContent.sectionsHotspotsItem.viewDetailsLinkText",
    );
    const [showQuickShop, setShowQuickShop] = useState(false);
    const { load, data: quickShopData, state } = useFetcher();
    const apiPath = usePrefixPathWithLocale(
      `/api/product?handle=${product?.handle}`,
    );

    // Handle click - open quick shop on mobile and tablet, popup on desktop
    const handleClick = () => {
      if (!isDesktopWidth(window.innerWidth)) {
        // Mobile and tablet: open QuickShop. Desktop uses the hover popup.
        if (!quickShopData && state !== "loading") {
          load(apiPath);
        }
        setShowQuickShop(true);
      }
    };

    return (
      <>
        <div
          ref={ref}
          {...rest}
          className="-translate-x-1/2 -translate-y-1/2 absolute hover:z-1"
          style={
            {
              top: `${offsetY}%`,
              left: `${offsetX}%`,
              "--translate-x-ratio": offsetX > 50 ? 1 : -1,
              "--translate-y-ratio": offsetY > 50 ? 1 : -1,
              "--spot-size": `${iconSize + 16}px`,
            } as CSSProperties
          }
        >
          {portalPopup ? (
            <>
              <button
                type="button"
                className="group flex lg:hidden"
                onClick={handleClick}
                aria-label={t("product.viewProduct", {
                  product: loaderData?.product?.title ?? product?.handle ?? "",
                })}
              >
                <HotspotMarker size={iconSize} />
              </button>
              <div className="hidden lg:block">
                <FloatingHotspot
                  product={loaderData?.product}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  showPrice={showPrice}
                  showViewDetailsLink={showViewDetailsLink}
                  viewDetailsLinkText={viewDetailsLinkText}
                >
                  <HotspotMarker size={iconSize} />
                </FloatingHotspot>
              </div>
            </>
          ) : (
            <div
              className="group relative flex cursor-pointer"
              onClick={handleClick}
            >
              <HotspotMarker size={iconSize} />
              {/* Desktop popup - only on actual desktop screens (1024px+) */}
              <div className="hidden lg:block">
                <ProductPopup
                  product={loaderData?.product}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  showPrice={showPrice}
                  showViewDetailsLink={showViewDetailsLink}
                  viewDetailsLinkText={viewDetailsLinkText}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Quick Shop */}
        <Dialog.Root open={showQuickShop} onOpenChange={setShowQuickShop}>
          <Dialog.Portal>
            <Dialog.Overlay
              className={clsx(
                "fixed inset-0 z-10 bg-black/50",
                showQuickShop ? "animate-fade-in" : "animate-fade-out",
              )}
            />
            <Dialog.Content
              className={clsx(
                "fixed inset-y-0 right-0 z-10 w-full bg-background py-2.5 shadow-2xl md:max-w-[430px] lg:hidden",
                showQuickShop
                  ? "animate-slide-in-right"
                  : "animate-slide-out-right",
              )}
              aria-describedby={undefined}
            >
              <div className="relative flex h-full flex-col">
                <Dialog.Title asChild>
                  <span className="sr-only">{t("product.quickShop")}</span>
                </Dialog.Title>
                <button
                  type="button"
                  onClick={() => setShowQuickShop(false)}
                  aria-label={t("product.closeQuickShop")}
                  className="absolute top-4 right-4 z-30 flex size-5 items-center justify-center"
                >
                  <XIcon className="size-5" />
                </button>

                <ScrollArea className="flex-1" size="sm">
                  <div className="px-5 pt-12 pb-8">
                    {quickShopData ? (
                      <QuickShop
                        data={quickShopData as any}
                        onCloseAll={() => setShowQuickShop(false)}
                      />
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-body-subtle">
                          {t("product.loadingData")}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  },
);

export default HotspotsItem;

export const loader = async (args: ComponentLoaderArgs<HotspotsItemData>) => {
  const { weaverse, data } = args;
  const { storefront } = weaverse;
  if (!data?.product) {
    return null;
  }

  try {
    const productHandle = data.product.handle;
    const { product } = await storefront.query<ProductQuery>(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions: [],
        language: storefront.i18n.language,
        country: storefront.i18n.country,
      },
    });

    return { product };
  } catch (error) {
    console.error("Error loading hotspots product data:", error);
    return null;
  }
};

export const schema = createSchema({
  type: "hotspots--item",
  title: "Hotspots item",
  settings: [
    {
      group: "Icon",
      inputs: [
        {
          type: "range",
          name: "iconSize",
          label: "Icon size",
          configs: {
            min: 16,
            max: 40,
            step: 1,
            unit: "px",
          },
          defaultValue: 34,
        },
        {
          type: "range",
          name: "offsetX",
          label: "Offset X",
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
          },
          defaultValue: 50,
        },
        {
          type: "range",
          name: "offsetY",
          label: "Offset Y",
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
          },
          defaultValue: 50,
        },
      ],
    },
    {
      group: "Product",
      inputs: [
        {
          type: "product",
          name: "product",
          label: "Product",
        },
        {
          type: "switch",
          name: "showPrice",
          label: "Show price",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showViewDetailsLink",
          label: "Show view details link",
          defaultValue: true,
        },
        {
          type: "text",
          name: "viewDetailsLinkText",
          label: "View details link text",
          defaultValue: "View details",
          condition: (data: HotspotsItemData) => data.showViewDetailsLink,
        },
      ],
    },
  ],
});
