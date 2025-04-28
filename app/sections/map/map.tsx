import { HydrogenComponentSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import Heading from "~/components/heading";
import type { SectionProps } from "~/components/section";
import { Section, sectionInspector } from "~/components/section";

interface MapSectionProps extends SectionProps {
  heading?: string;
}

let MapSection = forwardRef<HTMLElement, MapSectionProps>((props, ref) => {
  let { heading, children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      <div className="flex justify-center relative sm:flex-row flex-col-reverse gap-10">
        <div className="flex flex-col sm:gap-16 gap-10 sm:w-1/3 w-full">
          <div className="w-full px-12 sm:px-0">
            {heading && <Heading content={heading} as="h6" alignment="left" />}
          </div>
          <div className="flex flex-col">{children}</div>
        </div>
        <div className="flex-1 aspect-square sm:w-2/3 w-full" />
      </div>
    </Section>
  );
});

export default MapSection;

export let schema: HydrogenComponentSchema = {
  type: "map",
  title: "Map",
  childTypes: ["address-item"],
  inspector: [
    ...sectionInspector,
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading (optional)",
          defaultValue: "OUR STORES",
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "address-item",
        nameStore: "STORE 1",
        address: "11 P. Hoàng Ngân, Nhân Chính, Thanh Xuân, Hà Nội, Việt Nam",
      },
      {
        type: "address-item",
        nameStore: "STORE 2",
        address: "M2C3+QX Thành phố New York, Tiểu bang New York, Hoa Kỳ",
      },
      {
        type: "address-item",
        nameStore: "STORE 3",
        address: "288 Sporer Route, New Uteland, NV 73529-8830",
      },
    ],
  },
};
