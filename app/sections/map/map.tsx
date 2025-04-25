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
    <Section ref={ref} {...rest} className="bg-[#F6F4F3]">
      <div className="flex flex-col relative w-full">
        <div className="w-1/3 px-12">
          {heading && <Heading content={heading} as="h6" alignment="left" />}
        </div>
        {children}
        <div className="flex-1 relative min-h-[648px]" />
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
