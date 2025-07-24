import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { layoutInputs, Section } from "~/components/section";

interface HotspotsProps
  extends HydrogenComponentProps {}


let Hotspots = forwardRef<HTMLElement, HotspotsProps>((props, ref) => {
  let { children, ...rest } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      overflow="unset"
      containerClassName={"flex flex-col"}
    >
      {children}
    </Section>
  );
});

export default Hotspots;

export const schema = createSchema({
  type: "hotspots",
  title: "Hotspots",
  childTypes: [
    "hotspots-container",
    "hotspots-content",
  ],
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter(
          (inp) =>
            inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
  ],
  presets: {
    gap: 40,
    children: [
      {
        type: "hotspots-content",
      },
      {
        type: "hotspots-container",
      },
    ],
  },
});
