import { Circle, Handbag, Plus, Tag, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
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
import { ProductPopup } from "./product-popup";

export interface TestimonialHotspotsItemData {
  icon: "circle" | "plus" | "bag" | "tag";
  iconSize: number;
  offsetX: number;
  offsetY: number;
  product: WeaverseProduct;
  showPrice: boolean;
  showViewDetailsLink: boolean;
  viewDetailsLinkText: string;
}

interface TestimonialHotspotsItemProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    TestimonialHotspotsItemData {}

const ICONS = {
  circle: Circle,
  plus: Plus,
  bag: Handbag,
  tag: Tag,
};

let TestimonialHotspotsItem = forwardRef<
  HTMLDivElement,
  TestimonialHotspotsItemProps
>((props, ref) => {
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
  let Icon = ICONS[icon];

  // Quick shop state for mobile
  const [showQuickShop, setShowQuickShop] = useState(false);
  const { load, data: quickShopData, state } = useFetcher();
  const apiPath = usePrefixPathWithLocale(
    `/api/product?handle=${product?.handle}`,
  );

  // Handle click - open quick shop on mobile, popup on desktop
  const handleClick = () => {
    if (window.innerWidth < 768) {
      // Mobile breakpoint
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
        className="-translate-x-1/2 -translate-y-1/2 absolute hover:z-[1]"
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
        <div className="group relative flex cursor-pointer">
          <span
            className={clsx("absolute inline-flex animate-ping rounded-full", {
              "-translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 h-3/4 w-3/4 bg-white opacity-100 group-hover:opacity-100":
                icon === "circle",
              "h-full w-full bg-gray-700 opacity-75": icon !== "circle",
            })}
            style={{ animationDuration: "1500ms" }}
          />
          <span
            className={clsx(
              "group relative inline-flex rounded-full transition-all duration-300",
              {
                "bg-white p-2 hover:scale-110 hover:shadow-lg":
                  icon !== "circle",
                "bg-transparent hover:drop-shadow-lg": icon === "circle",
              },
            )}
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
            className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in"
            style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
          />
          <Dialog.Content
            className={clsx([
              "fixed inset-y-0 z-10 w-full bg-background py-2.5 md:max-w-[430px]",
              "right-0 shadow-2xl data-[state=open]:animate-enter-from-right",
            ])}
            aria-describedby={undefined}
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
                <Dialog.Title asChild>
                  <span className="font-semibold uppercase">Quick Shop</span>
                </Dialog.Title>
                <button
                  type="button"
                  onClick={() => setShowQuickShop(false)}
                  className="rounded p-1 transition-colors hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
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
                    <div className="py-8 text-center">
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
});

export default TestimonialHotspotsItem;

export let loader = async (
  args: ComponentLoaderArgs<TestimonialHotspotsItemData>,
) => {
  let { weaverse, data } = args;
  let { storefront } = weaverse;
  if (!data?.product) {
    return null;
  }
  let productHandle = data.product.handle;
  let { product } = await storefront.query<ProductQuery>(PRODUCT_QUERY, {
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
  type: "testimonial-hot--item",
  title: "Testimonial hotspots item",
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
          defaultValue: "View full details",
          condition: "showViewDetailsLink.eq.true",
        },
      ],
    },
  ],
});
