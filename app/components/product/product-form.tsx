import {
  createCartStore,
  createProductFormStore,
  type ProductFormOptions,
} from "@shopify/hydrogen";
import { createProductComponents } from "@shopify/hydrogen/react";
import type { ProductQuery } from "~/graphql/queries";
export type ProductFormData = NonNullable<ProductQuery["product"]>;
export const { ProductProvider, useProduct, useProductForm } =
  createProductComponents<ProductFormData>();
export function useSelectedVariant(product: ProductFormData) {
  const { selectedVariant } = useProduct();
  return selectedVariant?.product?.handle === product.handle
    ? selectedVariant
    : product.selectedOrFirstAvailableVariant;
}
export type MappedProductOptions = {
  name: string;
  optionValues: Array<
    ProductFormOptions<ProductFormData>[number]["values"][number] & {
      firstSelectableVariant: ProductFormData["selectedOrFirstAvailableVariant"];
      variantUriQuery: string;
      isDifferentProduct: boolean;
    }
  >;
};
/** Adapt the library's option state to Aspen's existing presentation props. */
export function getProductOptions(
  product: ProductFormData,
): MappedProductOptions[] {
  if (!product) {
    return [];
  }
  const cart = createCartStore();
  const form = createProductFormStore(product, cart);
  const options = form.getState().options.map((option) => ({
    name: option.name,
    optionValues: option.values.map((value) => {
      // Selected values can expose the current product's handle even when
      // Hydrogen resolved a combined-listing child. Keep identity and options
      // from that same resolved variant; retain the store's unresolved fallback.
      const variant = value.selected
        ? (product.selectedOrFirstAvailableVariant ?? value.variant)
        : value.variant;
      const handle = variant?.product?.handle ?? value.handle;
      const selectedOptions = variant?.selectedOptions ?? value.selectedOptions;
      return {
        ...value,
        handle,
        variant,
        selectedOptions,
        firstSelectableVariant: variant,
        isDifferentProduct: handle !== product.handle,
        variantUriQuery: new URLSearchParams(
          selectedOptions.map((o) => [o.name, o.value]),
        ).toString(),
      };
    }),
  }));
  form.destroy();
  cart.destroy();
  return options;
}
export function getAdjacentAndFirstAvailableVariants(product: ProductFormData) {
  return [
    product?.selectedOrFirstAvailableVariant,
    ...(product?.adjacentVariants || []),
    ...(product?.options || []).flatMap((o) =>
      o.optionValues.map((v) => v.firstSelectableVariant),
    ),
  ].filter(Boolean);
}
export function mapSelectedProductOptionToObject(
  options: Array<{ name: string; value: string }>,
) {
  return Object.fromEntries(
    (options || []).map(({ name, value }) => [name, value]),
  );
}
