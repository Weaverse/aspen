import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { cn } from "~/utils/cn";

interface TestimonialProps extends HydrogenComponentProps {}

const TestimonialItem = forwardRef<HTMLDivElement, TestimonialProps>(
  (props, ref) => {
    const { children, className, ...rest } = props;

    return (
      <div ref={ref} {...rest} className={cn("contents", className)}>
        <div className="mx-auto grid h-full min-w-0 w-full max-w-[1360px] grid-cols-1 overflow-x-clip md:grid-cols-2 md:items-stretch md:gap-8 md:px-(--page-padding) md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,52.94%)] lg:gap-16 lg:py-20">
          {children}
        </div>
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
