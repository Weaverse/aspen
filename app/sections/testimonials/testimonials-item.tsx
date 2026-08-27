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
        className="mx-auto grid h-full w-full max-w-[1360px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,52.94%)] lg:gap-16 lg:py-20"
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
  childTypes: ["testimonial--content", "testimonial--hotspots-item"],
  presets: {
    children: [
      { type: "testimonial--content" },
      { type: "testimonial--hotspots-item" },
    ],
  },
});
