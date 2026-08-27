import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Children, createContext, forwardRef, useContext } from "react";
import type { ImageAspectRatio } from "~/types/image";
import { type HotspotsLayout, useHotspotsLayout } from ".";

type HotspotsAspectRatio = ImageAspectRatio | "design";

interface HotspotsProps extends HydrogenComponentProps {
  gap?: number;
  desktopGap?: number;
  aspectRatio?: HotspotsAspectRatio;
}

export const HotspotsContext = createContext<{
  aspectRatio?: HotspotsAspectRatio;
  layout: HotspotsLayout;
}>({ layout: "split" });

export const useHotspotsContext = () => useContext(HotspotsContext);

let Hotspots = forwardRef<HTMLDivElement, HotspotsProps>((props, ref) => {
  let {
    children,
    gap = 16,
    desktopGap = 20,
    aspectRatio = "design",
    ...rest
  } = props;
  const { layout, isLegacyLayout } = useHotspotsLayout();
  const resolvedMobileGap = isLegacyLayout ? 16 : gap;
  const resolvedDesktopGap = isLegacyLayout ? 20 : desktopGap;
  const resolvedAspectRatio = isLegacyLayout ? "design" : aspectRatio;
  const images = Children.toArray(children).slice(
    0,
    layout === "single" ? 1 : 2,
  );

  const containerStyle = {
    "--hotspots-mobile-gap": `${resolvedMobileGap}px`,
    "--hotspots-desktop-gap": `${resolvedDesktopGap}px`,
  } as React.CSSProperties;

  return (
    <HotspotsContext.Provider
      value={{ aspectRatio: resolvedAspectRatio, layout }}
    >
      <div
        ref={ref}
        {...rest}
        className={clsx(
          "grid w-full",
          layout === "single"
            ? "grid-cols-1"
            : "grid-cols-1 gap-[var(--hotspots-mobile-gap)] md:grid-cols-2 md:gap-[var(--hotspots-desktop-gap)]",
        )}
        style={containerStyle}
      >
        {images}
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
          label: "Mobile spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
        {
          type: "range",
          name: "desktopGap",
          label: "Desktop spacing",
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
          defaultValue: "design",
          configs: {
            options: [
              {
                value: "design",
                label: "Responsive design (recommended)",
              },
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
    gap: 16,
    desktopGap: 20,
    aspectRatio: "design",
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
