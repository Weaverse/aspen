import { HydrogenComponentSchema, useParentInstance } from "@weaverse/hydrogen";
import { forwardRef, useEffect, useRef, useState, useContext } from "react";
import { MapPinLine, PlusCircle, MinusCircle } from "@phosphor-icons/react";
import clsx from "clsx";
import { MapContext } from './map';
import * as Accordion from "@radix-ui/react-accordion";

interface AddressProps {
  address: string;
  nameStore: string;
  heading: string;
  phoneNumber?: string;
  openingHours?: string;
  openingHoursSat?: string;
}

let Address = forwardRef<HTMLDivElement, AddressProps>((props, ref) => {
  let { heading, address, nameStore, phoneNumber, openingHours, openingHoursSat, ...rest } = props;
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the MapContext to get layout information and active item state
  const { layoutMap, activeItem, setActiveItem, activeAddress, setActiveAddress } = useContext(MapContext);
  
  // Generate a unique id for this address instance and item index
  const [instanceId] = useState(() => Math.random().toString(36).substring(7));
  const [itemIndex] = useState(() => {
    // Create a stable numeric index from the instanceId for Accordion.Item value
    return parseInt(instanceId, 36) % 1000;
  });
  
  // Update active address when this component mounts or address changes
  useEffect(() => {
    if (itemIndex === 0) { // If this is the first address item
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
      console.log(`Set active address: ${address}`)
    }
  }, [isAccordionOpen, address, setActiveAddress]);

  // Original list layout (restore to the old version):
  if (layoutMap === 'list') {
    const handleClick = () => {
      // Set this as the active item for map display
      setActiveItem(itemIndex);
      // Update the active address
      setActiveAddress(address);
      setActiveIndex(1); // For visual feedback
    };

    return (
      <div ref={containerRef} {...rest}>
        <div
          className="md:px-0"
          onClick={handleClick}
        >
          <div
            className={clsx(
              "flex items-center gap-2.5 cursor-pointer transition-colors text-[#524B46]/80 hover:text-[#524B46] p-3",
              activeItem === itemIndex ? "bg-gray-100" : "")
            }
          >
            <MapPinLine size={24} weight="light" className="text-[#918379]" />
            <div className="flex flex-col">
              <span className="text-base font-medium">
                {nameStore}
              </span>
              <span className="text-base">
                {address}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Accordion layout (new):
  if (layoutMap === 'accordion') {
    return (
      <Accordion.Item
        ref={containerRef}
        value={`item-${itemIndex}`}
        className="border-b border-[#F3F3F3] w-full"
        {...rest}
      >
        <Accordion.Trigger
          className={clsx(
            'group w-full px-4 py-4 flex items-center justify-between',
            'transition-all duration-200 outline-none',
          )}
          onClick={() => {
            // Update the active address when clicked
            setActiveAddress(address);
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <MapPinLine size={18} weight="light" className="text-[#918379] flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-[#29231E] uppercase">
                {nameStore}
              </span>
            </div>
          </div>
          <div className="relative h-5 w-5 ml-auto">
            <PlusCircle
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full text-[#524B46] transition-opacity duration-200 group-data-[state=open]:opacity-0"
              aria-hidden
            />
            <MinusCircle
              size={20}
              weight="regular"
              className="absolute inset-0 h-full w-full text-[#524B46] transition-opacity duration-200 opacity-0 group-data-[state=open]:opacity-100"
              aria-hidden
            />
          </div>
        </Accordion.Trigger>
        
        <Accordion.Content
          style={{
            "--expand-to": "var(--radix-accordion-content-height)",
            "--expand-duration": "0.25s",
            "--collapse-from": "var(--radix-accordion-content-height)",
            "--collapse-duration": "0.25s",
          } as React.CSSProperties}
          className={clsx(
            "overflow-hidden",
            "data-[state=closed]:animate-collapse",
            "data-[state=open]:animate-expand",
          )}
        >
      
          {/* Additional info shown when accordion is open */}
          <div className="px-4 pb-4 ml-[calc(18px+0.75rem)]">
            {/* Address and Phone Number */}
            <div className="flex flex-col mb-3">
              <span className="text-sm text-[#524B46] font-semibold">Address:</span>
              <span className="text-sm text-[#524B46] mt-1">{address}</span>
              
              {phoneNumber && (
                <div className="mt-2">
                  <span className="text-sm text-[#524B46] font-semibold">Phone:</span>
                  <span className="text-sm text-[#524B46] block">{phoneNumber}</span>
                </div>
              )}
            </div>
            
            {/* Opening Hours */}
            {(openingHours || openingHoursSat) && (
              <div className="text-sm text-[#524B46] mb-2">
                <div className="flex flex-col">
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
      <div
        className="md:px-0"
        onClick={handleClick}
      >
        <div
          className={clsx(
            "flex items-center gap-2.5 cursor-pointer transition-colors text-[#524B46]/80 hover:text-[#524B46] p-3",
            activeItem === itemIndex ? "bg-gray-100" : "")
          }
        >
          <MapPinLine size={24} weight="light" className="text-[#918379]" />
          <div className="flex flex-col">
            <span className="text-base font-medium">
              {nameStore}
            </span>
            <span className="text-base">
              {address}
            </span>
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
