import { Circle, Handbag, Plus, Tag } from "@phosphor-icons/react";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef } from "react";
import type { ProductQuery } from "storefront-api.generated";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { ProductPopup } from "./product-popup";

export interface HotspotsItemData {
  icon: "circle" | "plus" | "bag" | "tag";
  iconSize: number;
  offsetX: number;
  offsetY: number;
  product: WeaverseProduct;
  popupWidth: number;
  showPrice: boolean;
  showViewDetailsLink: boolean;
  viewDetailsLinkText: string;
}

interface HotspotsItemProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    HotspotsItemData {}

const ICONS = {
  circle: Circle,
  plus: Plus,
  bag: Handbag,
  tag: Tag,
};

let HotspotsItem = forwardRef<HTMLDivElement, HotspotsItemProps>(
  (props, ref) => {
    let {
      icon,
      iconSize,
      offsetX,
      offsetY,
      product,
      popupWidth,
      showPrice,
      showViewDetailsLink,
      viewDetailsLinkText,
      children,
      loaderData,
      ...rest
    } = props;
    let Icon = ICONS[icon];

    return (
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
        <div className="relative flex cursor-pointer">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-700 opacity-75"
            style={{ animationDuration: "1500ms" }}
          />
          <span className="relative inline-flex rounded-full p-2 bg-white group">
            <Icon style={{ width: iconSize, height: iconSize }} />
            <ProductPopup
              product={loaderData?.product}
              popupWidth={popupWidth}
              offsetX={offsetX}
              offsetY={offsetY}
              showPrice={showPrice}
              showViewDetailsLink={showViewDetailsLink}
              viewDetailsLinkText={viewDetailsLinkText}
            />
          </span>
        </div>
      </div>
    );
  },
);

export default HotspotsItem;

export let loader = async (args: ComponentLoaderArgs<HotspotsItemData>) => {
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

export let schema = createSchema({
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
          type: "range",
          name: "popupWidth",
          label: "Popup width",
          configs: {
            min: 300,
            max: 600,
            step: 10,
            unit: "px",
          },
          defaultValue: 350,
          helpText: "For desktop devices only",
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
          condition: (data) => data.showViewDetailsLink,
        },
      ],
    },
  ],
});
