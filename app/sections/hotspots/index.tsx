import { createSchema } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";
import { cn } from "~/utils/cn";

export type HotspotsLayout = "single" | "split";

interface HotspotsProps extends SectionProps {
  layout?: HotspotsLayout;
}

interface HotspotsLayoutContextValue {
  layout: HotspotsLayout;
  isLegacyLayout: boolean;
}

const HotspotsLayoutContext = createContext<HotspotsLayoutContextValue>({
  layout: "split",
  isLegacyLayout: false,
});

export const useHotspotsLayout = () => useContext(HotspotsLayoutContext);

let Hotspots = forwardRef<HTMLElement, HotspotsProps>((props, ref) => {
  let {
    children,
    className,
    layout,
    backgroundColor = "#F0F0EF",
    backgroundFor = "section",
    ...rest
  } = props;
  const resolvedLayout = layout ?? "split";
  const isLegacyLayout = layout === undefined;
  const isSingleImage = resolvedLayout === "single";

  return (
    <HotspotsLayoutContext.Provider
      value={{ layout: resolvedLayout, isLegacyLayout }}
    >
      <Section
        ref={ref}
        {...rest}
        className={cn("overflow-x-clip bg-[#F0F0EF]", className)}
        containerClassName={cn(
          "flex flex-col",
          !isSingleImage && "px-(--page-padding) py-20",
        )}
        backgroundColor={backgroundColor || "#F0F0EF"}
        backgroundFor={backgroundFor}
        gap={isSingleImage ? 0 : 64}
        overflow="unset"
        verticalPadding="none"
        width="full"
      >
        {children}
      </Section>
    </HotspotsLayoutContext.Provider>
  );
});

export default Hotspots;

export const schema = createSchema({
  type: "hotspots",
  title: "Hotspots",
  childTypes: ["hotspots-container", "hotspots-content"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Image layout",
          configs: {
            options: [
              { value: "single", label: "Single image — full width" },
              { value: "split", label: "Two images — stacked on mobile" },
            ],
          },
          defaultValue: "split",
        },
      ],
    },
    ...sectionSettings.filter((group) => group.group === "Background"),
  ],
  presets: {
    layout: "split",
    gap: 64,
    width: "full",
    verticalPadding: "none",
    backgroundColor: "#F0F0EF",
    backgroundFor: "section",
    children: [
      {
        type: "hotspots-content",
        gap: 20,
      },
      {
        type: "hotspots-container",
        gap: 16,
        desktopGap: 20,
        aspectRatio: "design",
      },
    ],
  },
});
