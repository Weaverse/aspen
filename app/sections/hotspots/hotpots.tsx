import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, createContext, useContext, Children } from "react";
import type { ImageAspectRatio } from "~/types/image";

interface HotspotsProps extends HydrogenComponentProps {
  gap?: number;
  aspectRatio?: ImageAspectRatio;
}

export const HotspotsContext = createContext<{
  aspectRatio?: ImageAspectRatio;
}>({});

export const useHotspotsContext = () => useContext(HotspotsContext);

let Hotspots = forwardRef<HTMLDivElement, HotspotsProps>((props, ref) => {
  let { children, gap = 20, aspectRatio = "adapt", ...rest } = props;

  const childrenCount = Children.count(children);

  const containerStyle = {
    display: 'grid' as const,
    gap: `${gap}px`,
  };

  return (
    <HotspotsContext.Provider value={{ aspectRatio }}>
      <div 
        ref={ref} 
        {...rest}
        className={clsx("w-full", childrenCount === 1 ? "grid-cols-1" : "md:grid-cols-2 grid-cols-1")}
        style={containerStyle}
      >
        {children}
      </div>
    </HotspotsContext.Provider>
  );
});

export default Hotspots;

export let schema = createSchema({
  type: "hotspots-container",
  title: "Hotspots",
  limit: 1,
  childTypes: ["hotspots-image"],
  settings: [
    {
      group: "Layout",
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
        {
          type: "select",
          name: "aspectRatio",
          label: "Aspect ratio",
          defaultValue: "adapt",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "hotspots-image",
      },
      {
        type: "hotspots-image",
      },
    ],
  },
});
