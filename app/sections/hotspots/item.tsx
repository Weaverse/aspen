import { HandbagIcon, PlusIcon, TagIcon } from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef, useState, useRef } from "react";
import { useFetcher } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { ProductPopup } from "./product-popup";
import { QuickShop } from "~/components/product/quick-shop";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import clsx from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "@phosphor-icons/react";
import { ScrollArea } from "~/components/scroll-area";

export interface HotspotsItemData {
  icon: "circle" | "plus" | "bag" | "tag";
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
    HotspotsItemData {}

const ICONS = {
  circle: CircleDotIcon,
  plus: PlusIcon,
  bag: HandbagIcon,
  tag: TagIcon,
};

function CircleDotIcon(props: any) {
  let { width, height, ...rest } = props;
  return (
    <div
      style={{ width: width, height: height }}
      className="flex justify-center items-center border border-white rounded-full p-3.5"
    >
      <span className="bg-white w-1.5 h-1.5 rounded-full"></span>
    </div>
  );
}

const HotspotsItem = forwardRef<HTMLDivElement, HotspotsItemProps>(
  (props, ref) => {
    const {
      icon,
      iconSize,
      offsetX,
      offsetY,
      product,
      showPrice,
      showViewDetailsLink,
      viewDetailsLinkText,
      children,
      loaderData,
      ...rest
    } = props;
    const Icon = ICONS[icon];
    const [showQuickShop, setShowQuickShop] = useState(false);
    const { load, data: quickShopData, state } = useFetcher();
    const apiPath = usePrefixPathWithLocale(
      `/api/product?handle=${product?.handle}`,
    );

    // Handle click - open quick shop on mobile, popup on desktop
    const handleClick = () => {
      if (window.innerWidth < 768) { // Mobile breakpoint
        // On mobile, open QuickShop
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
          className="absolute -translate-x-1/2 -translate-y-1/2 hover:z-1"
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
          <div className="relative flex cursor-pointer group">
            <span
              className={clsx("animate-ping absolute inline-flex rounded-full", {
                "bg-white opacity-100 group-hover:opacity-100 w-3/4 h-3/4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2": icon === "circle",
                "bg-gray-700 opacity-75 h-full w-full": icon !== "circle"
              })}
              style={{ animationDuration: "1500ms" }}
            />
            <span
              className={clsx("relative inline-flex rounded-full group transition-all duration-300", {
                "bg-white p-2 hover:shadow-lg hover:scale-110": icon !== "circle",
                "bg-transparent hover:drop-shadow-lg": icon === "circle",
              })}
              onClick={handleClick}
            >
              <Icon style={{ width: iconSize, height: iconSize }} />
              {/* Desktop popup */}
              <div className="hidden md:block">
                <ProductPopup
                  product={loaderData?.product}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  showPrice={showPrice}
                  showViewDetailsLink={showViewDetailsLink}
                  viewDetailsLinkText={viewDetailsLinkText}
                />
              </div>
            </span>
          </div>
        </div>

        {/* Mobile Quick Shop */}
        <Dialog.Root open={showQuickShop} onOpenChange={setShowQuickShop}>
          <Dialog.Portal>
            <Dialog.Overlay
              className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-10"
              style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
            />
            <Dialog.Content
              className={clsx([
                "fixed inset-y-0 w-full md:max-w-[430px] bg-background py-2.5 z-10",
                "right-0 data-[state=open]:animate-enter-from-right shadow-2xl",
              ])}
              aria-describedby={undefined}
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 flex-shrink-0 py-3">
                  <Dialog.Title asChild>
                    <span className="font-semibold uppercase">Quick Shop</span>
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={() => setShowQuickShop(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1" size="sm">
                  <div className="px-5 py-4">
                    {quickShopData ? (
                      <QuickShop
                        data={quickShopData as any}
                        showDescription={false}
                        setShowDescription={() => {}}
                        onCloseAll={() => setShowQuickShop(false)}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-body-subtle">
                          Loading product data...
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
};

export const schema = createSchema({
  type: "hotspots--item",
  title: "Hotspots item",
  settings: [
    {
      group: "Icon",
      inputs: [
        {
          type: "toggle-group",
          name: "icon",
          label: "Icon",
          configs: {
            options: [
              {
                label: "Circle",
                value: "circle",
                icon: "circle",
              },
              {
                label: "Plus",
                value: "plus",
                icon: "plus",
              },
              {
                label: "Bag",
                value: "bag",
                icon: "shopping-bag",
              },
              {
                label: "Tag",
                value: "tag",
                icon: "tag",
              },
            ],
          },
          defaultValue: "plus",
        },
        {
          type: "range",
          name: "iconSize",
          label: "Icon size",
          configs: {
            min: 16,
            max: 32,
            step: 2,
            unit: "px",
          },
          defaultValue: 20,
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
