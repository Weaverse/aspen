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
  phoneNumber?: string;
  openingHours?: string;
  openingHoursSat?: string;
}

let Address = forwardRef<HTMLDivElement, AddressProps>((props, _ref) => {
  let {
    address,
    nameStore,
    phoneNumber,
    openingHours,
    openingHoursSat,
    ...rest
  } = props;
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    layoutMap,
    activeItem,
    setActiveItem,
    setActiveAddress,
    registerAddress,
    activeBackgroundColor,
    addressFontColor,
  } = useContext(MapContext);

  const [itemIndex, setItemIndex] = useState<number>(-1);

  useEffect(() => {
    const index = registerAddress(address);
    setItemIndex(index);

    // Only set the address as active if this is the first address (index 0)
    // and no other address has been set yet
    if (index === 0) {
      setActiveAddress(address);
    }
  }, [address, registerAddress, setActiveAddress]);

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
              "flex cursor-pointer items-center gap-2.5 p-3 transition-colors hover:opacity-80",
              activeItem === itemIndex ? "" : "",
            )}
            style={{
              color: addressFontColor,
              opacity: activeItem === itemIndex ? 1 : 0.8,
              backgroundColor:
                activeItem === itemIndex ? activeBackgroundColor : undefined,
            }}
          >
            <MapPinLineIcon
              size={24}
              weight="light"
              style={{ color: addressFontColor }}
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
              className="flex-shrink-0"
              style={{ color: addressFontColor }}
            />
            <div className="flex flex-col text-left">
              <span
                className="font-semibold text-sm uppercase"
                style={{ color: addressFontColor }}
              >
                {nameStore}
              </span>
            </div>
          </div>
          <div className="relative ml-auto h-5 w-5">
            <PlusCircleIcon
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full transition-opacity duration-200 group-data-[state=open]:opacity-0"
              style={{ color: addressFontColor }}
              aria-hidden
            />
            <MinusCircleIcon
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100"
              style={{ color: addressFontColor }}
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
                <span
                  className="font-semibold text-sm"
                  style={{ color: addressFontColor }}
                >
                  Address:
                </span>
              )}
              <span
                className="mt-1 text-sm"
                style={{ color: addressFontColor }}
              >
                {address}
              </span>

              {phoneNumber && (
                <div className="mt-2">
                  {layoutMap !== "accordion" && (
                    <span
                      className="font-semibold text-sm"
                      style={{ color: addressFontColor }}
                    >
                      Phone:
                    </span>
                  )}
                  <span
                    className="block text-sm"
                    style={{ color: addressFontColor }}
                  >
                    {phoneNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            {(openingHours || openingHoursSat) && (
              <div
                className={cn(
                  "text-sm",
                  layoutMap === "accordion" ? "mb-0 flex-1" : "mb-2",
                )}
                style={{ color: addressFontColor }}
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
            "flex cursor-pointer items-center gap-2.5 p-3 transition-colors hover:opacity-80",
            activeItem === itemIndex ? "" : "",
          )}
          style={{
            color: addressFontColor,
            opacity: activeItem === itemIndex ? 1 : 0.8,
            backgroundColor:
              activeItem === itemIndex ? activeBackgroundColor : undefined,
          }}
        >
          <MapPinLineIcon
            size={24}
            weight="light"
            style={{ color: addressFontColor }}
          />
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
  settings: [
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
