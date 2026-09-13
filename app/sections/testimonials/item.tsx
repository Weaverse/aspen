import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import HotspotsItem, {
  type HotspotsItemData,
  schema as hotspotsSchema,
  type loader,
} from "../hotspots/item";

// Keep the saved Weaverse component type while sharing the hotspot UI and flow.
export interface TestimonialHotspotsItemData extends HotspotsItemData {
  icon?: "circle" | "plus" | "bag" | "tag";
}

interface TestimonialHotspotsItemProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    TestimonialHotspotsItemData {}

const TestimonialHotspotsItem = forwardRef<
  HTMLDivElement,
  TestimonialHotspotsItemProps
>(({ icon: _legacyIcon, ...props }, ref) => (
  <HotspotsItem {...props} ref={ref} portalPopup />
));

export default TestimonialHotspotsItem;
export { loader } from "../hotspots/item";
export const schema = {
  ...hotspotsSchema,
  type: "testimonial-hot--item",
  title: "Testimonial hotspots item",
};
