import {
  createSchema,
  type HydrogenComponentProps,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

let variants = cva("", {
  variants: {
    gap: {
      0: "",
      4: "space-y-1",
      8: "space-y-2",
      12: "space-y-3",
      16: "space-y-4",
      20: "space-y-5",
      24: "space-y-3 lg:space-y-6",
      28: "space-y-3.5 lg:space-y-7",
      32: "space-y-4 lg:space-y-8",
      36: "space-y-4 lg:space-y-9",
      40: "space-y-5 lg:space-y-10",
      44: "space-y-5 lg:space-y-11",
      48: "space-y-6 lg:space-y-12",
      52: "space-y-6 lg:space-y-[52px]",
      56: "space-y-7 lg:space-y-14",
      60: "space-y-7 lg:space-y-[60px]",
    },
  },
  defaultVariants: {
    gap: 28,
  },
});

interface ContentInformationProps extends VariantProps<typeof variants>, HydrogenComponentProps {
}



const ContentInformation = forwardRef<HTMLDivElement, ContentInformationProps>(
  (props, ref) => {
    let { children, gap, ...rest } = props;

    return (
      <div ref={ref} {...rest} className={variants({ gap })}>
        {children}
      </div>
    );
  }
);

export default ContentInformation;

export const schema = createSchema({
  type: "content-information",
  title: "Content Information",
  inspector: [
    {
      group: "Content settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "information--item"],
  presets: {
    children: [
      {
        type: "heading",
        content: "CUSTOMER SERVICE",
        alignment: "left",
      },
      {
        type: "subheading",
        content: "We offer support via email.",
        alignment: "left",
      },
      {
        type: "information--item",
      },
      {
        type: "information--item",
      },
      {
        type: "information--item",
      },
    ],
  },
});
