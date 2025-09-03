import {
  MapPinLineIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { forwardRef, useContext, useEffect, useRef, useState } from "react";
import { cn } from "~/utils/cn";
import { MapContext } from "./map";

interface AddressProps {
  address: string;
  nameStore: string;
  heading: string;
  phoneNumber?: string;
  openingHours?: string;
  openingHoursSat?: string;
}

let Address = forwardRef<HTMLDivElement, AddressProps>((props, ref) => {
  let {
    heading,
    address,
    nameStore,
    phoneNumber,
    openingHours,
    openingHoursSat,
    ...rest
  } = props;
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the MapContext to get layout information and active item state
  const {
    layoutMap,
    activeItem,
    setActiveItem,
    activeAddress,
    setActiveAddress,
  } = useContext(MapContext);

  // Generate a unique id for this address instance and item index
  const [instanceId] = useState(() => Math.random().toString(36).substring(7));
  const [itemIndex] = useState(() => {
    // Create a stable numeric index from the instanceId for Accordion.Item value
    return Number.parseInt(instanceId, 36) % 1000;
  });

  // Update active address when this component mounts or address changes
  useEffect(() => {
    if (itemIndex === 0) {
      // If this is the first address item
      setActiveAddress(address); // Set it as the default active address
    }
  }, [address, itemIndex, setActiveAddress]);

  // Determine if this accordion item is open
  const isAccordionOpen = activeItem === itemIndex;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveIndex(0); // Reset when clicking outside
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Trigger a map update by setting the address
  useEffect(() => {
    if (isAccordionOpen) {
      setActiveAddress(address);
      console.log(`Set active address: ${address}`);
    }
  }, [isAccordionOpen, address, setActiveAddress]);

  // Original list layout (restore to the old version):
  if (layoutMap === "list") {
    const handleClick = () => {
      // Set this as the active item for map display
      setActiveItem(itemIndex);
      // Update the active address
      setActiveAddress(address);
      setActiveIndex(1); // For visual feedback
    };

    return (
      <div ref={containerRef} {...rest}>
        <div className="md:px-0" onClick={handleClick}>
          <div
            className={clsx(
              "flex cursor-pointer items-center gap-2.5 p-3 text-[#524B46]/80 transition-colors hover:text-[#524B46]",
              activeItem === itemIndex ? "bg-gray-100" : "",
            )}
          >
            <MapPinLineIcon
              size={24}
              weight="light"
              className="text-[#918379]"
            />
            <div className="flex flex-col">
              <span className="font-medium text-base">{nameStore}</span>
              <span className="text-base">{address}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Accordion layout (new):
  if (layoutMap === "accordion") {
    return (
      <Accordion.Item
        ref={containerRef}
        value={`item-${itemIndex}`}
        className="w-full border-[#F3F3F3] border-b"
        {...rest}
      >
        <Accordion.Trigger
          className={clsx(
            "group flex w-full items-center justify-between px-4 py-4",
            "outline-none transition-all duration-200",
          )}
          onClick={() => {
            // Update the active address when clicked
            setActiveAddress(address);
          }}
        >
          <div className="flex w-full items-center gap-3">
            <MapPinLineIcon
              size={18}
              weight="light"
              className="flex-shrink-0 text-[#918379]"
            />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[#29231E] text-sm uppercase">
                {nameStore}
              </span>
            </div>
          </div>
          <div className="relative ml-auto h-5 w-5">
            <PlusCircleIcon
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full text-[#524B46] transition-opacity duration-200 group-data-[state=open]:opacity-0"
              aria-hidden
            />
            <MinusCircleIcon
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full text-[#524B46] opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100"
              aria-hidden
            />
          </div>
        </Accordion.Trigger>

        <Accordion.Content
          style={
            {
              "--expand-to": "var(--radix-accordion-content-height)",
              "--expand-duration": "0.25s",
              "--collapse-from": "var(--radix-accordion-content-height)",
              "--collapse-duration": "0.25s",
            } as React.CSSProperties
          }
          className={clsx(
            "overflow-hidden",
            "data-[state=closed]:animate-collapse",
            "data-[state=open]:animate-expand",
          )}
        >
          {/* Additional info shown when accordion is open */}
          <div
            className={cn(
              layoutMap === "accordion"
                ? "flex gap-4 px-4 pb-4"
                : "ml-[calc(18px+0.75rem)] px-4 pb-4",
            )}
          >
            {/* Address and Phone Number */}
            <div
              className={cn(
                "flex flex-col",
                layoutMap === "accordion" ? "mb-0 flex-1" : "mb-3",
              )}
            >
              {layoutMap !== "accordion" && (
                <span className="font-semibold text-[#524B46] text-sm">
                  Address:
                </span>
              )}
              <span className="mt-1 text-[#524B46] text-sm">{address}</span>

              {phoneNumber && (
                <div className="mt-2">
                  {layoutMap !== "accordion" && (
                    <span className="font-semibold text-[#524B46] text-sm">
                      Phone:
                    </span>
                  )}
                  <span className="block text-[#524B46] text-sm">
                    {phoneNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            {(openingHours || openingHoursSat) && (
              <div
                className={cn(
                  "text-[#524B46] text-sm",
                  layoutMap === "accordion" ? "mb-0 flex-1" : "mb-2",
                )}
              >
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">Opening hours:</span>
                  {openingHours && <span>{openingHours}</span>}
                  {openingHoursSat && <span>{openingHoursSat}</span>}
                </div>
              </div>
            )}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    );
  }

  // Default to original list layout implementation if not accordion
  const handleClick = () => {
    // Set this as the active item for map display
    setActiveItem(itemIndex);
    // Update the active address
    setActiveAddress(address);
    setActiveIndex(1); // For visual feedback
  };

  return (
    <div ref={containerRef} {...rest}>
      <div className="md:px-0" onClick={handleClick}>
        <div
          className={clsx(
            "flex cursor-pointer items-center gap-2.5 p-3 text-[#524B46]/80 transition-colors hover:text-[#524B46]",
            activeItem === itemIndex ? "bg-gray-100" : "",
          )}
        >
          <MapPinLineIcon size={24} weight="light" className="text-[#918379]" />
          <div className="flex flex-col">
            <span className="font-medium text-base">{nameStore}</span>
            <span className="text-base">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Address;

export let schema: HydrogenComponentSchema = {
  type: "address-item",
  title: "Address",
  inspector: [
    {
      group: "Address",
      inputs: [
        {
          type: "text",
          name: "nameStore",
          label: "Store name",
          defaultValue: "WEST STORE",
        },
        {
          type: "text",
          name: "address",
          label: "Address",
          defaultValue: "288 Sporer Route, New Uteland, NV 73529-8830",
        },
        {
          type: "text",
          name: "phoneNumber",
          label: "Phone Number",
          defaultValue: "+12 984 4827 34",
        },
        {
          type: "text",
          name: "openingHours",
          label: "Opening Hours Weekdays",
          defaultValue: "Mon - Fri: 8:00AM -10:00PM",
        },
        {
          type: "text",
          name: "openingHoursSat",
          label: "Opening Hours Weekend",
          defaultValue: "Sat - Sun: 8:00AM -11:00PM",
        },
      ],
    },
  ],
};
