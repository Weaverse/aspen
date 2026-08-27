import {
  MapPinLineIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import {
  type HydrogenComponentSchema,
  useChildInstances,
  useItemInstance,
  useParentInstance,
  useTranslation,
} from "@weaverse/hydrogen";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useContext,
  useEffect,
} from "react";
import { cn } from "~/utils/cn";
import { MapContext } from "./map";

interface AddressProps extends HTMLAttributes<HTMLDivElement> {
  address: string;
  nameStore: string;
  phoneNumber?: string;
  openingHours?: string;
  openingHoursSat?: string;
  itemIndex?: number;
}

const Address = forwardRef<HTMLDivElement, AddressProps>((props, ref) => {
  const { t } = useTranslation();
  const {
    address,
    nameStore,
    phoneNumber,
    openingHours,
    openingHoursSat,
    itemIndex = 0,
    className,
    ...rest
  } = props;
  const {
    layoutMap,
    activeItem,
    setActiveItem,
    setActiveAddress,
    activeBackgroundColor,
    addressFontColor,
  } = useContext(MapContext);

  const itemInstance = useItemInstance();
  const parentInstance = useParentInstance();
  const siblingInstances = useChildInstances(parentInstance?._id);
  const instanceIndex = siblingInstances.findIndex(
    (instance) => instance._id === itemInstance?._id,
  );
  const resolvedItemIndex = instanceIndex >= 0 ? instanceIndex : itemIndex;
  const isActive = activeItem === resolvedItemIndex;

  useEffect(() => {
    if (isActive) {
      setActiveAddress(address);
    }
  }, [address, isActive, setActiveAddress]);

  if (layoutMap === "list") {
    return (
      <div ref={ref} className={className} {...rest}>
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-start gap-2.5 rounded-(--radius-sm) p-3 text-left transition-opacity hover:opacity-80",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)",
          )}
          style={{
            color: addressFontColor,
            opacity: isActive ? 1 : 0.8,
            backgroundColor: isActive ? activeBackgroundColor : undefined,
          }}
          onClick={() => {
            setActiveItem(resolvedItemIndex);
            setActiveAddress(address);
          }}
          aria-pressed={isActive}
        >
          <MapPinLineIcon
            size={16}
            weight="light"
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-xs uppercase leading-4 tracking-wide">
              {nameStore}
            </span>
            <span className="text-[11px] leading-[1.45]">{address}</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <Accordion.Item
      ref={ref}
      value={`item-${resolvedItemIndex}`}
      className={cn(
        "w-full border-(--color-line-subtle) border-b last:border-b-0",
        className,
      )}
      {...rest}
    >
      <Accordion.Trigger
        className={cn(
          "group flex w-full items-center justify-between gap-4 bg-[#F3F3F3] px-4 py-4 text-left",
          "outline-none transition-colors hover:bg-[#EDEDED] focus-visible:ring-2 focus-visible:ring-inset",
        )}
        onClick={() => setActiveAddress(address)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <MapPinLineIcon
            size={16}
            weight="light"
            className="shrink-0"
            style={{ color: addressFontColor }}
            aria-hidden
          />
          <span
            className="truncate font-medium text-xs uppercase leading-4 tracking-wide"
            style={{ color: addressFontColor }}
          >
            {nameStore}
          </span>
        </span>
        <span className="relative h-4 w-4 shrink-0">
          <PlusCircleIcon
            size={16}
            weight="light"
            className="absolute inset-0 transition-opacity group-data-[state=open]:opacity-0"
            style={{ color: addressFontColor }}
            aria-hidden
          />
          <MinusCircleIcon
            size={16}
            weight="light"
            className="absolute inset-0 opacity-0 transition-opacity group-data-[state=open]:opacity-100"
            style={{ color: addressFontColor }}
            aria-hidden
          />
        </span>
      </Accordion.Trigger>

      <Accordion.Content
        style={
          {
            "--expand-to": "var(--radix-accordion-content-height)",
            "--expand-duration": "0.25s",
            "--collapse-from": "var(--radix-accordion-content-height)",
            "--collapse-duration": "0.25s",
          } as CSSProperties
        }
        className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand"
      >
        <div
          className="grid grid-cols-2 gap-6 bg-white px-4 py-4 text-[11px] leading-[1.55]"
          style={{ color: addressFontColor }}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span>{address}</span>
            {phoneNumber && <span>{phoneNumber}</span>}
          </div>

          {(openingHours || openingHoursSat) && (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium">{t("map.openingHours")}:</span>
              {openingHours && <span>{openingHours}</span>}
              {openingHoursSat && <span>{openingHoursSat}</span>}
            </div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
});

export default Address;

export const schema: HydrogenComponentSchema = {
  type: "address-item",
  title: "Store address",
  settings: [
    {
      group: "Store",
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
          label: "Map address",
          defaultValue: "81 Greene Street, New York, NY 10012",
          helpText:
            "Use a complete street address so the embedded map can locate the store accurately.",
        },
        {
          type: "text",
          name: "phoneNumber",
          label: "Phone number",
          defaultValue: "+1 212 555 0148",
        },
        {
          type: "text",
          name: "openingHours",
          label: "Weekday hours",
          defaultValue: "Mon - Fri: 10:00AM - 7:00PM",
        },
        {
          type: "text",
          name: "openingHoursSat",
          label: "Weekend hours",
          defaultValue: "Sat - Sun: 11:00AM - 6:00PM",
        },
      ],
    },
  ],
};
