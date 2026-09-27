import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";

interface InstagramGridProps extends HydrogenComponentProps {}

const InstagramGrid = forwardRef<HTMLDivElement, InstagramGridProps>(
  ({ children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        {...rest}
        className="instagram-grid-wrap w-full min-w-0 md:flex-1"
      >
        <div className="instagram-grid grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-5">
          {children}
        </div>
      </div>
    );
  },
);

export default InstagramGrid;

export const schema = createSchema({
  // Keep the serialized type for existing section documents even though the
  // component now renders a static grid rather than a slider.
  type: "instagram--slider",
  title: "Image grid",
  limit: 1,
  settings: [],
  childTypes: ["instagram--image"],
  presets: {
    children: Array.from({ length: 8 }, () => ({
      type: "instagram--image",
    })),
  },
});
