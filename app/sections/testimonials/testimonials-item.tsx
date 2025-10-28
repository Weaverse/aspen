import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";

interface TestimonialProps extends HydrogenComponentProps {}

const TestimonialItem = forwardRef<HTMLDivElement, TestimonialProps>(
  (props, ref) => {
    const { children, ...rest } = props;

    return (
      <div
        ref={ref}
        {...rest}
        className="flex h-full flex-col gap-10 px-0 px-5 md:flex-row md:px-10"
      >
        {children}
      </div>
    );
  },
);

export default TestimonialItem;

export const schema = createSchema({
  type: "testimonial--item",
  title: "Testimonial",
  inspector: [],
  childTypes: ["testimonial--content", "testimonial--hotspots-item"],
  presets: {
    children: [
      { type: "testimonial--content" },
      { type: "testimonial--hotspots-item" },
    ],
  },
});
