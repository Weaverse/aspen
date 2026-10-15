import { HandbagIcon, PlusIcon, TagIcon } from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef, useRef, useState } from "react";
import type {
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { QuickShopTrigger } from "~/components/product/quick-shop";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { isDesktopWidth } from "~/utils/breakpoints";
import { FloatingHotspot } from "./floating-hotspot";

export interface HotspotsItemData {
  icon?: "circle" | "plus" | "bag" | "tag";
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

// Matches the "Tag" marker component in Figma (node 364:16957): a 34x34
// circle with a 1px white border and a centered 6x6 white dot, wrapped in
// an always-on 42x42 pulse ring, with a white/30% fill added on hover.
const HOTSPOT_ICONS = {
  plus: PlusIcon,
  bag: HandbagIcon,
  tag: TagIcon,
};

function HotspotMarker({
  icon = "circle",
  size,
}: {
  icon?: HotspotsItemData["icon"];
  size: number;
}) {
  const ringInset = -(42 - size) / 2;
  if (icon !== "circle") {
    const Icon = HOTSPOT_ICONS[icon];
    return (
      <span className="relative inline-flex items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-gray-700 opacity-75"
          style={{ animationDuration: "1500ms" }}
        />
        <span className="relative inline-flex rounded-full bg-white p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
          <Icon aria-hidden="true" style={{ width: size, height: size }} />
        </span>
      </span>
    );
  }

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
      icon = "circle",
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
    const [quickAddOptions, setQuickAddOptions] = useState<
      ProductVariantFragment["selectedOptions"]
    >([]);
    const markerRef = useRef<HTMLButtonElement>(null);
    const desktopMarkerRef = useRef<HTMLButtonElement>(null);

    const openQuickAdd = (
      selectedOptions: ProductVariantFragment["selectedOptions"] = [],
    ) => {
      setQuickAddOptions(selectedOptions);
      setShowQuickShop(true);
    };

    // Handle click - open quick shop on mobile and tablet, popup on desktop
    const handleClick = () => {
      if (!isDesktopWidth(window.innerWidth)) {
        // Mobile and tablet: open QuickShop. Desktop uses the hover popup.
        openQuickAdd();
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
          <button
            ref={markerRef}
            type="button"
            className="group flex lg:hidden"
            onClick={handleClick}
            aria-label={t("product.viewProduct", {
              product: loaderData?.product?.title ?? product?.handle ?? "",
            })}
          >
            <HotspotMarker icon={icon} size={iconSize} />
          </button>
          <div className="hidden lg:block">
            <FloatingHotspot
              markerRef={desktopMarkerRef}
              onQuickAdd={openQuickAdd}
              product={loaderData?.product}
              offsetX={offsetX}
              offsetY={offsetY}
              showPrice={showPrice}
              showViewDetailsLink={showViewDetailsLink}
              viewDetailsLinkText={viewDetailsLinkText}
            >
              <HotspotMarker icon={icon} size={iconSize} />
            </FloatingHotspot>
          </div>
        </div>

        {/* Quick Shop opened by the marker or the desktop card action. */}
        <QuickShopTrigger
          productHandle={product?.handle ?? loaderData?.product?.handle ?? ""}
          open={showQuickShop}
          onOpenChange={setShowQuickShop}
          hideTrigger
          selectedOptions={quickAddOptions}
          onCloseFocus={() => {
            const marker = isDesktopWidth(window.innerWidth)
              ? desktopMarkerRef.current
              : markerRef.current;
            marker?.focus();
          }}
        />
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
          type: "toggle-group",
          name: "icon",
          label: "Icon",
          configs: {
            options: [
              { label: "Circle", value: "circle", icon: "circle" },
              { label: "Plus", value: "plus", icon: "plus" },
              { label: "Bag", value: "bag", icon: "shopping-bag" },
              { label: "Tag", value: "tag", icon: "tag" },
            ],
          },
          defaultValue: "circle",
        },
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
