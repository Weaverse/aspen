import { HydrogenComponentSchema, useParentInstance } from "@weaverse/hydrogen";
import { forwardRef, useEffect, useRef, useState } from "react";
import { MapPinLine } from "@phosphor-icons/react";
import clsx from "clsx";

interface AddressProps {
  address: string;
  nameStore: string;
  heading: string;
}

let Address = forwardRef<HTMLDivElement, AddressProps>((props, ref) => {
  let { heading, address, nameStore, ...rest } = props;
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveIndex(0); // Reset khi click ra ngoài
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div ref={containerRef} {...rest}>
      <div
        className="w-1/3 px-10"
        onClick={() => setActiveIndex(activeIndex + 1)}
      >
        <div
          className={clsx(
            "flex items-center gap-2.5 cursor-pointer transition-colors text-[#524B46]/80 hover:text-[#524B46] p-3",
            activeIndex === 1 ? "bg-white" : "")
          }
        >
          <MapPinLine size={24} weight="light" className="text-[#918379]" />
          <div className="flex flex-col">
            <span className="font-['Open_Sans'] text-base tracking-[0.02em] leading-[1.4em]">
              {nameStore}
            </span>
            <span className="font-['Open_Sans'] text-base tracking-[0.02em] leading-[1.4em]">
              {address}
            </span>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "w-2/3 aspect-square absolute right-0 top-0",
          activeIndex === 1 ? "z-[1]" : "z-0"
        )}
      >
        <iframe
          className="w-full h-full"
          title="Google map embedded frame"
          src={`https://maps.google.com/maps?t=m&q=${address}&ie=UTF8&&output=embed`}
          style={{ border: 0 }}
          allowFullScreen
        />
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
          name: "address",
          label: "Address",
          defaultValue: "301 Front St W, Toronto, ON M5V 2T6, Canada",
        },
        {
          type: "text",
          name: "nameStore",
          label: "Store name",
          defaultValue: "STORE 1",
        },
      ],
    },
  ],
};
