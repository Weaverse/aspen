import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { createContext, forwardRef, useEffect, useRef, useState } from "react";
import Heading from "~/components/heading";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

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

  const num = Number.parseInt(color, 16);
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
  registerAddress: (address: string) => void;
}>({
  layoutMap: "list",
  activeItem: null,
  setActiveItem: () => {},
  activeAddress: "",
  setActiveAddress: () => {},
  registerAddress: () => {},
});

let MapSection = forwardRef<HTMLElement, MapSectionProps>((props, ref) => {
  let { heading, children, layoutMap = "list", ...rest } = props;

  // Track which item is active in accordion mode and its address for the map
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [registeredAddresses, setRegisteredAddresses] = useState<string[]>([]);
  const [activeAddress, setActiveAddress] = useState<string>(
    props.defaultAddress || "",
  );

  let registerAddress = (address: string) => {
    setRegisteredAddresses((prev) => {
      if (!prev.includes(address)) {
        return [...prev, address];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (registeredAddresses.length > 0) {
      setActiveAddress(props.defaultAddress || registeredAddresses[0]);
    }
  }, [registeredAddresses, props.defaultAddress]);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [highlightBg, setHighlightBg] = useState<string | null>(null);
  useEffect(() => {
    const current = triggerRef.current;
    if (!current) return;
    const sectionEl = current.closest("section") as HTMLElement | null;
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
        registerAddress,
      }}
    >
      <Section ref={ref} {...rest}>
        <div
          ref={triggerRef}
          className={clsx(
            "relative flex flex-col-reverse justify-center gap-10 md:flex-row",
            layoutMap === "list" ? "" : "items-center",
          )}
        >
          {/* List & Accordion layouts - Left column */}
          <div
            className={clsx(
              layoutMap === "list"
                ? "flex w-full flex-col gap-10 md:w-1/3 md:gap-16"
                : "md:-translate-x-1/2 z-1 flex w-full flex-col gap-8 bg-(--form-bg-color) p-10 md:absolute md:w-1/2 md:gap-8",
            )}
            style={{ "--form-bg-color": highlightBg } as React.CSSProperties}
          >
            {/* Heading */}
            <div className="w-full md:px-0">
              {heading && (
                <Heading content={heading} as="h6" alignment="left" />
              )}
            </div>

            {/* Content */}
            {layoutMap === "list" ? (
              <div className="relative flex flex-col">{children}</div>
            ) : (
              <div className="overflow-hidden rounded-md bg-(--section-bg-color)">
                <AccordionPrimitive.Root
                  type="single"
                  defaultValue="item-0"
                  className="w-full"
                  onValueChange={(value) => {
                    if (value) {
                      const index = Number.parseInt(value.replace("item-", ""));
                      setActiveItem(index);
                    }
                  }}
                >
                  {children}
                </AccordionPrimitive.Root>
              </div>
            )}
          </div>

          {/* Map container - Right column */}
          <div className="relative w-full md:ml-auto md:w-3/4">
            {/* Map that displays the active address */}
            <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100 md:aspect-[16/12]">
              {/* We use the same iframe for both layouts now */}
              <iframe
                key={activeAddress}
                className="h-full w-full"
                title="Google map embedded frame"
                src={`https://maps.google.com/maps?t=m&q=${encodeURIComponent(
                  activeAddress,
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
