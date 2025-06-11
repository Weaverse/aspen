import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { ProductCard } from "~/components/product/product-card";
import { Swimlane } from "~/components/swimlane";

let variants = cva("", {
  variants: {
    gap: {
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
  },
  defaultVariants: {
    gap: 16,
  },
});

interface ProductItemsProps extends VariantProps<typeof variants> {}

let ProductItems = forwardRef<HTMLDivElement, ProductItemsProps>(
  (props, ref) => {
    let { gap, ...rest } = props;
    let parent = useParentInstance();
    let products = parent.data?.loaderData?.products;

    return (
      <div ref={ref} {...rest}>
        <Swimlane className={variants({ gap })}>
          {products?.nodes?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="snap-start w-80"
            />
          ))}
        </Swimlane>
      </div>
    );
  },
);

export default ProductItems;

export let schema = createSchema({
  type: "featured-products-items",
  title: "Product items",
  settings: [
    {
      group: "Product items",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 8,
            max: 32,
            step: 4,
          },
          defaultValue: 16,
        },
      ],
    },
  ],
});
