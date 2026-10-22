import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  type HydrogenComponentSchema,
  IMAGES_PLACEHOLDERS,
  useChildInstances,
  useTranslation,
} from "@weaverse/hydrogen";
import { createContext, forwardRef, useEffect, useMemo, useState } from "react";
import { sectionBackgroundInputs } from "~/components/background-image";
import Heading from "~/components/heading";
import { Image } from "~/components/image";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";

interface MapSectionProps extends SectionProps {
  heading?: string;
  layoutMap?: "accordion" | "list";
  defaultAddress?: string;
  activeBackgroundColor?: string;
  panelBackgroundColor?: string;
  addressFontColor?: string;
}

const DEFAULT_BACKGROUND_COLOR = "#F9F9F9";

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

const mapDesktopFrameClassName = {
  md: "md:aspect-[16/10] md:rounded-(--radius-md)",
  lg: "lg:aspect-[16/10] lg:rounded-(--radius-md)",
  xl: "xl:aspect-[16/10] xl:rounded-(--radius-md)",
} as const;

export const MapFrame = ({
  address,
  className,
  desktopFrom = "xl",
}: {
  address: string;
  className?: string;
  desktopFrom?: keyof typeof mapDesktopFrameClassName;
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-(--color-bg-subtle)",
        "aspect-[375/469.125]",
        mapDesktopFrameClassName[desktopFrom],
        className,
      )}
    >
      {address?.trim() ? (
        <iframe
          key={address}
          className="absolute inset-0 h-full w-full"
          title={t("map.embeddedFrame")}
          src={`https://maps.google.com/maps?t=m&q=${encodeURIComponent(address)}&ie=UTF8&&output=embed`}
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <Image
          data={{
            url: IMAGES_PLACEHOLDERS.image,
            altText: t("accessibility.imagePlaceholder"),
          }}
          sizes="auto"
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
};

const MapSection = forwardRef<HTMLElement, MapSectionProps>((props, ref) => {
  const translateText = useTranslatedText();

  const {
    heading: rawI18nHeading,
    children,
    layoutMap = "list",
    defaultAddress,
    activeBackgroundColor = "#DFDFDF",
    panelBackgroundColor = "#FFFFFF",
    addressFontColor = "#524B46",
    backgroundColor,
    ...rest
  } = props;
  const heading = translateText(
    rawI18nHeading,
    "themeContent.sectionsMapMap.heading",
  );

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
          className={cn(
            "text-[28px] leading-[1.1] tracking-[-0.03em]",
            layoutMap === "list"
              ? "md:text-[44px] md:max-lg:text-[37px] md:max-lg:tracking-[-0.02em]"
              : "md:max-lg:text-[44px] xl:text-[44px]",
          )}
        />
      )}

      {layoutMap === "list" ? (
        <div className="flex flex-col gap-1 md:max-lg:gap-[23px]">
          {children}
        </div>
      ) : (
        <AccordionPrimitive.Root
          type="single"
          defaultValue="item-0"
          className="flex w-full flex-col gap-2 overflow-hidden rounded-(--radius-sm)"
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
      <Section
        ref={ref}
        {...rest}
        backgroundFor="section"
        backgroundColor={backgroundColor ?? DEFAULT_BACKGROUND_COLOR}
        width="full"
        verticalPadding="none"
      >
        {layoutMap === "list" ? (
          <div className="mx-auto grid w-full md:max-w-(--page-width) md:grid-cols-[280px_minmax(0,1fr)] md:gap-12 md:px-(--page-padding) md:py-(--section-padding-y) md:max-lg:grid-cols-1 md:max-lg:gap-10 md:max-lg:px-0 md:max-lg:pt-0 md:max-lg:pb-20 xl:gap-16">
            <div className="order-2 flex flex-col gap-8 px-6 py-12 md:order-1 md:gap-10 md:px-0 md:py-0 md:max-lg:order-2 md:max-lg:px-8">
              {content}
            </div>
            <MapFrame
              address={activeAddress}
              desktopFrom="lg"
              className="order-1 md:order-2 md:max-lg:order-1 md:max-lg:aspect-video"
            />
          </div>
        ) : (
          <div className="relative mx-auto w-full md:max-lg:flow-root xl:max-w-(--page-width) xl:px-(--page-padding) xl:py-(--section-padding-y)">
            <MapFrame
              address={activeAddress}
              desktopFrom="xl"
              className="md:max-lg:absolute md:max-lg:inset-0 md:max-lg:h-full md:max-lg:aspect-auto xl:ml-auto xl:w-3/4"
            />
            <div
              className={cn(
                "relative z-1 flex flex-col gap-8 rounded-(--radius-md) px-6 py-12",
                "md:max-lg:mx-8 md:max-lg:my-[108px] md:max-lg:w-[487px] md:max-lg:max-w-[calc(100%-64px)] md:max-lg:p-10",
                "xl:absolute xl:top-1/2 xl:left-(--page-padding) xl:w-[52%] xl:-translate-y-1/2 xl:gap-10 xl:p-10",
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
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "layoutMap",
          label: "Layout",
          defaultValue: "list",
          configs: {
            options: [
              { value: "list", label: "Style 1" },
              { value: "accordion", label: "Style 2" },
            ],
          },
          helpText:
            "Style 1: map above the store list on mobile and tablet; side by side on desktop. Style 2: overlay panel on tablet (768–1032px) and large desktop (1280px+); stacked accordion at other widths.",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "OUR STORES",
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
          label: "Style 2 panel background",
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
    ...sectionSettings.map((group) =>
      group.group === "Background"
        ? {
            ...group,
            inputs: sectionBackgroundInputs(DEFAULT_BACKGROUND_COLOR),
          }
        : group,
    ),
  ],
  presets: {
    width: "full",
    verticalPadding: "none",
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    heading: "OUR STORES",
    layoutMap: "list",
    activeBackgroundColor: "#DFDFDF",
    panelBackgroundColor: "#FFFFFF",
    addressFontColor: "#524B46",
    children: [
      {
        type: "address-item",
        nameStore: "Store 1",
      },
      {
        type: "address-item",
        nameStore: "Store 2",
      },
      {
        type: "address-item",
        nameStore: "Store 3",
      },
    ],
  },
};
