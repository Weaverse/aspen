import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  type HydrogenComponentSchema,
  useChildInstances,
} from "@weaverse/hydrogen";
import { createContext, forwardRef, useEffect, useMemo, useState } from "react";
import Heading from "~/components/heading";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";
import { cn } from "~/utils/cn";

interface MapSectionProps extends SectionProps {
  heading?: string;
  layoutMap?: "accordion" | "list";
  defaultAddress?: string;
  activeBackgroundColor?: string;
  panelBackgroundColor?: string;
  addressFontColor?: string;
}

interface MapContextValue {
  layoutMap: "accordion" | "list";
  activeItem: number;
  setActiveItem: (index: number) => void;
  setActiveAddress: (address: string) => void;
  activeBackgroundColor: string;
  addressFontColor: string;
}

export const MapContext = createContext<MapContextValue>({
  layoutMap: "list",
  activeItem: 0,
  setActiveItem: () => {
    // Replaced by the section provider at runtime.
  },
  setActiveAddress: () => {
    // Replaced by the section provider at runtime.
  },
  activeBackgroundColor: "#DFDFDF",
  addressFontColor: "#524B46",
});

const MapFrame = ({
  address,
  className,
}: {
  address: string;
  className?: string;
}) => (
  <div
    className={cn(
      "relative w-full overflow-hidden bg-(--color-bg-subtle)",
      "aspect-[375/469.125] lg:aspect-[16/10] lg:rounded-(--radius-md)",
      className,
    )}
  >
    <iframe
      key={address}
      className="absolute inset-0 h-full w-full"
      title="Google map embedded frame"
      src={`https://maps.google.com/maps?t=m&q=${encodeURIComponent(address)}&ie=UTF8&&output=embed`}
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
    />
  </div>
);

const MapSection = forwardRef<HTMLElement, MapSectionProps>((props, ref) => {
  const {
    heading,
    children,
    layoutMap = "list",
    defaultAddress,
    activeBackgroundColor = "#DFDFDF",
    panelBackgroundColor = "#FFFFFF",
    addressFontColor = "#524B46",
    ...rest
  } = props;

  const childInstances = useChildInstances();
  const firstAddress =
    (childInstances.find((instance) => instance.data.type === "address-item")
      ?.data.address as string | undefined) || "";

  const [activeItem, setActiveItem] = useState(0);
  const [activeAddress, setActiveAddress] = useState(
    defaultAddress || firstAddress,
  );

  useEffect(() => {
    if (!activeAddress && (defaultAddress || firstAddress)) {
      setActiveAddress(defaultAddress || firstAddress);
    }
  }, [activeAddress, defaultAddress, firstAddress]);

  useEffect(() => {
    setActiveItem(0);
    if (firstAddress) {
      setActiveAddress(firstAddress);
    }
  }, [firstAddress]);

  const contextValue = useMemo(
    () => ({
      layoutMap,
      activeItem,
      setActiveItem,
      setActiveAddress,
      activeBackgroundColor,
      addressFontColor,
    }),
    [layoutMap, activeItem, activeBackgroundColor, addressFontColor],
  );

  const content = (
    <>
      {heading && (
        <Heading
          content={heading}
          as="h2"
          alignment="left"
          weight="400"
          letterSpacing="tight"
          className="text-[28px] leading-[1.15] lg:text-[32px]"
        />
      )}

      {layoutMap === "list" ? (
        <div className="flex flex-col gap-1">{children}</div>
      ) : (
        <AccordionPrimitive.Root
          type="single"
          defaultValue="item-0"
          className="w-full overflow-hidden rounded-(--radius-sm)"
          onValueChange={(value) => {
            if (value) {
              setActiveItem(Number.parseInt(value.replace("item-", ""), 10));
            }
          }}
        >
          {children}
        </AccordionPrimitive.Root>
      )}
    </>
  );

  return (
    <MapContext.Provider value={contextValue}>
      <Section ref={ref} {...rest} width="full" verticalPadding="none">
        {layoutMap === "list" ? (
          <div className="mx-auto grid w-full lg:max-w-(--page-width) lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:px-(--page-padding) lg:py-(--section-padding-y) xl:gap-16">
            <div className="order-2 flex flex-col gap-8 px-6 py-12 lg:order-1 lg:gap-10 lg:px-0 lg:py-0">
              {content}
            </div>
            <MapFrame address={activeAddress} className="order-1 lg:order-2" />
          </div>
        ) : (
          <div className="relative mx-auto w-full lg:max-w-(--page-width) lg:px-(--page-padding) lg:py-(--section-padding-y)">
            <MapFrame address={activeAddress} className="lg:ml-auto lg:w-3/4" />
            <div
              className={cn(
                "relative z-1 flex flex-col gap-8 px-6 py-12",
                "lg:absolute lg:top-1/2 lg:left-(--page-padding) lg:w-[52%] lg:-translate-y-1/2 lg:gap-10 lg:p-10",
              )}
              style={{ backgroundColor: panelBackgroundColor }}
            >
              {content}
            </div>
          </div>
        )}
      </Section>
    </MapContext.Provider>
  );
});

export default MapSection;

export const schema: HydrogenComponentSchema = {
  type: "map",
  title: "Map",
  childTypes: ["address-item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "OUR STORES",
        },
        {
          type: "toggle-group",
          name: "layoutMap",
          label: "Layout",
          defaultValue: "list",
          configs: {
            options: [
              { value: "list", label: "Scenario 1 — Store list" },
              { value: "accordion", label: "Scenario 2 — Accordion" },
            ],
          },
          helpText:
            "Scenario 1 places the store list beside the map. Scenario 2 overlays an accordion panel on desktop.",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "activeBackgroundColor",
          label: "Selected store background",
          defaultValue: "#DFDFDF",
        },
        {
          type: "color",
          name: "panelBackgroundColor",
          label: "Accordion panel background",
          defaultValue: "#FFFFFF",
          condition: (data: MapSectionProps) => data.layoutMap === "accordion",
        },
        {
          type: "color",
          name: "addressFontColor",
          label: "Store text",
          defaultValue: "#524B46",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    width: "full",
    verticalPadding: "none",
    backgroundColor: "#F6F4F3",
    heading: "OUR STORES",
    layoutMap: "list",
    activeBackgroundColor: "#DFDFDF",
    panelBackgroundColor: "#FFFFFF",
    addressFontColor: "#524B46",
    children: [
      {
        type: "address-item",
        nameStore: "ASPEN SOHO",
        address: "81 Greene Street, New York, NY 10012",
        phoneNumber: "+1 212 555 0148",
        openingHours: "Mon - Fri: 10:00AM - 7:00PM",
        openingHoursSat: "Sat - Sun: 11:00AM - 6:00PM",
      },
      {
        type: "address-item",
        nameStore: "ASPEN BROOKLYN",
        address: "55 Water Street, Brooklyn, NY 11201",
        phoneNumber: "+1 718 555 0196",
        openingHours: "Mon - Fri: 10:00AM - 7:00PM",
        openingHoursSat: "Sat - Sun: 11:00AM - 6:00PM",
      },
      {
        type: "address-item",
        nameStore: "ASPEN LOS ANGELES",
        address: "8220 Melrose Avenue, Los Angeles, CA 90046",
        phoneNumber: "+1 323 555 0124",
        openingHours: "Mon - Fri: 10:00AM - 7:00PM",
        openingHoursSat: "Sat - Sun: 11:00AM - 6:00PM",
      },
    ],
  },
};
