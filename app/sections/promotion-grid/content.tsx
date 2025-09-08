import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

interface PromotionGridProps
  extends HydrogenComponentProps,
    VariantProps<typeof variants> {}

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      left: "items-start justify-center [&_.paragraph]:[text-align:left]",
      center: "items-center justify-center [&_.paragraph]:[text-align:center]",
      right: "items-end justify-center [&_.paragraph]:[text-align:right]",
    },
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
    gap: 32,
  },
});

const PromotionGrid = forwardRef<HTMLDivElement, PromotionGridProps>(
  (props, ref) => {
    const { children, gap, contentPosition, ...rest } = props;
    return (
      <div
        ref={ref}
        {...rest}
        className={variants({
          contentPosition,
          gap,
        })}
      >
        {children}
      </div>
    );
  },
);

export default PromotionGrid;

export const schema = createSchema({
  type: "promotion-grid-content",
  title: "Promotion grid content",
  limit: 1,
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Gap",
          defaultValue: 32,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
        {
          type: "toggle-group",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "left" },
              { value: "center", label: "center" },
              { value: "right", label: "right" },
            ],
          },
        },
      ],
    },
  ],
  childTypes: ["heading", "subheading", "paragraph", "button"],
  presets: {
    children: [
      { type: "heading", content: "EXPLORE MORE" },
      {
        type: "paragraph",
        content:
          "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
      },
    ],
  },
});
