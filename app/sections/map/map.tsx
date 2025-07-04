import { type HydrogenComponentSchema } from "@weaverse/hydrogen";
import { createContext, forwardRef, useState, useRef, useEffect } from "react";
import Heading from "~/components/heading";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";

interface MapSectionProps extends SectionProps {
  heading?: string;
  layoutMap?: "accordion" | "list";
  defaultAddress?: string;
}

function adjustColor(hex: string, amount: number) {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));

  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Create a context to share the layout mode with child components
export const MapContext = createContext<{
  layoutMap: "accordion" | "list";
  activeItem: number | null;
  setActiveItem: (index: number | null) => void;
  activeAddress: string;
  setActiveAddress: (address: string) => void;
}>({
  layoutMap: "list",
  activeItem: null,
  setActiveItem: () => {},
  activeAddress: "",
  setActiveAddress: () => {},
});

let MapSection = forwardRef<HTMLElement, MapSectionProps>((props, ref) => {
  let { heading, children, layoutMap = "list", ...rest } = props;
  // Track which item is active in accordion mode and its address for the map
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [activeAddress, setActiveAddress] = useState<string>(
    props.defaultAddress || "New York"
  );
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [highlightBg, setHighlightBg] = useState<string | null>(null);
  useEffect(() => {
    const current = triggerRef.current;
    if (!current) return;
    const sectionEl = current.closest("section") as HTMLElement | null; // hoặc closest()
    if (sectionEl) {
      const raw = getComputedStyle(sectionEl)
        .getPropertyValue("--section-bg-color")
        .trim();
      if (raw.startsWith("#")) {
        setHighlightBg(adjustColor(raw, 20));
      }
    }
  }, []);

  return (
    <MapContext.Provider
      value={{
        layoutMap,
        activeItem,
        setActiveItem,
        activeAddress,
        setActiveAddress,
      }}
    >
      <Section ref={ref} {...rest}>
        <div
          ref={triggerRef}
          className={clsx(
            "flex justify-center relative md:flex-row flex-col-reverse gap-10",
            layoutMap === "list" ? "" : "items-center"
          )}
        >
          {/* List & Accordion layouts - Left column */}
          <div
            className={clsx(
              layoutMap === "list"
                ? "flex flex-col md:gap-16 gap-10 md:w-1/3 w-full"
                : "flex flex-col md:gap-8 gap-8 md:w-1/2 w-full md:absolute md:-translate-x-1/2 z-1 p-10 bg-(--form-bg-color)"
            )}
            style={{ "--form-bg-color": highlightBg } as React.CSSProperties}
          >
            {/* Heading */}
            <div className="w-full md:px-0">
              {heading && layoutMap === "list" ? (
                <Heading content={heading} as="h6" alignment="left" />
              ) : (
                <Heading content={heading} as="h6" alignment="left" />
              )}
            </div>

            {/* Content */}
            {layoutMap === "list" ? (
              <div className="flex flex-col relative">{children}</div>
            ) : (
              <div className="bg-(--section-bg-color) rounded-md overflow-hidden">
                <AccordionPrimitive.Root
                  type="single"
                  defaultValue="item-0"
                  className="w-full"
                  onValueChange={(value) => {
                    if (value) {
                      const index = parseInt(value.replace("item-", ""));
                      setActiveItem(index);
                    }
                  }}
                >
                  {children}
                </AccordionPrimitive.Root>
              </div>
            )}
          </div>
          {layoutMap === "accordion" && (
            <div className="hidden md:block md:w-1/3 w-full"></div>
          )}

          {/* Map container - Right column */}
          <div className={clsx("flex-1 md:w-2/3 md:ml-auto w-full relative")}>
            {/* Map that displays the active address */}
            <div
              className={clsx(
                layoutMap === "accordion"
                  ? "w-full h-full bg-gray-100 rounded-md overflow-hidden aspect-square"
                  : "w-full h-full bg-gray-100 aspect-square relative"
              )}
            >
              {/* We use the same iframe for both layouts now */}
              <iframe
                key={activeAddress}
                className="w-full h-full"
                title="Google map embedded frame"
                src={`https://maps.google.com/maps?t=m&q=${encodeURIComponent(
                  activeAddress
                )}&ie=UTF8&&output=embed`}
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </Section>
    </MapContext.Provider>
  );
});

export default MapSection;

export let schema: HydrogenComponentSchema = {
  type: "map",
  title: "Map",
  childTypes: ["address-item"],
  inspector: [
    ...sectionSettings,
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading (optional)",
          defaultValue: "OUR STORES",
        },
        {
          type: "toggle-group",
          name: "layoutMap",
          label: "Choose map layout",
          defaultValue: "list",
          configs: {
            options: [
              { value: "accordion", label: "Accordion" },
              { value: "list", label: "List" },
            ],
          },
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "address-item",
        nameStore: "STORE 1",
        address: "11 P. Hoàng Ngân, Nhân Chính, Thanh Xuân, Hà Nội, Việt Nam",
      },
      {
        type: "address-item",
        nameStore: "STORE 2",
        address: "M2C3+QX Thành phố New York, Tiểu bang New York, Hoa Kỳ",
      },
      {
        type: "address-item",
        nameStore: "STORE 3",
        address: "288 Sporer Route, New Uteland, NV 73529-8830",
      },
    ],
  },
};
