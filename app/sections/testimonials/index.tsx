import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { Section, layoutInputs } from "~/components/section";

type TestimonialProps = SectionProps;

const TestimonialIndex = forwardRef<HTMLElement, TestimonialProps>(
  
  (props, ref) => {
      const { children, ...rest } = props;

    return (
      <Section
        ref={ref}
        {...rest}
        containerClassName="flex flex-col h-full md:px-10 gap-10 px-5 md:flex-row px-0"
      >
        {children}
      </Section>
    );
  },
);

export default TestimonialIndex;

export const schema = createSchema({
  type: "testimonial",
  title: "Testimonial",
  inspector: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
  ],
  childTypes: ["testimonial--content", "testimonial--hotspots"],
  presets: {
    verticalPadding: "small",
    backgroundColor: "#F6F4F3",
    backgroundFor: "content",
    alignment: "left",
    children: [
      { type: "testimonial--content" },
      { type: "testimonial--hotspots", aspectRatio: "1/1" },
    ],
  },
});
