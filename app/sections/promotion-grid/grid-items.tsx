import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useChildInstances,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  forwardRef,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BackgroundImage } from "~/components/background-image";
import Link from "~/components/link";
import { Overlay } from "~/components/overlay";
import Paragraph from "~/components/paragraph";
import type { SectionProps } from "~/components/section";
import "swiper/css";
import { cn } from "~/utils/cn";
import type { PromotionArrowsProps } from "./arrows";
import { Arrows } from "./arrows";
import type { PromotionDotsProps } from "./dots";
import { Dots } from "./dots";

type GridItemProps = VariantProps<typeof variants> &
  SectionProps &
  PromotionArrowsProps &
  PromotionDotsProps & {
    layout?: "slider" | "tabs";
    slidesToShow?: number;
    autoPlay?: boolean;
    autoPlayDelay?: number;
    showDots?: boolean;
    showArrows?: boolean;
    tabsHeight?: number;
  };

let variants = cva("promotion-slider group relative px-0 md:px-8", {
  variants: {
    slidesToShow: {
      1: "",
      2: "",
      3: "",
      4: "",
    },
    gap: {
      0: "[&_.swiper-slide]:mr-0",
      4: "[&_.swiper-slide]:mr-1",
      8: "[&_.swiper-slide]:mr-2",
      12: "[&_.swiper-slide]:mr-3",
      16: "[&_.swiper-slide]:mr-4",
      20: "[&_.swiper-slide]:mr-5",
      24: "[&_.swiper-slide]:mr-3 lg:[&_.swiper-slide]:mr-6",
      28: "[&_.swiper-slide]:mr-3.5 lg:[&_.swiper-slide]:mr-7",
      32: "[&_.swiper-slide]:mr-4 lg:[&_.swiper-slide]:mr-8",
      36: "[&_.swiper-slide]:mr-4 lg:[&_.swiper-slide]:mr-9",
      40: "[&_.swiper-slide]:mr-5 lg:[&_.swiper-slide]:mr-10",
      44: "[&_.swiper-slide]:mr-5 lg:[&_.swiper-slide]:mr-11",
      48: "[&_.swiper-slide]:mr-6 lg:[&_.swiper-slide]:mr-12",
      52: "[&_.swiper-slide]:mr-6 lg:[&_.swiper-slide]:mr-[52px]",
      56: "[&_.swiper-slide]:mr-7 lg:[&_.swiper-slide]:mr-14",
      60: "[&_.swiper-slide]:mr-7 lg:[&_.swiper-slide]:mr-[60px]",
    },
  },
  defaultVariants: {
    slidesToShow: 2,
    gap: 20,
  },
});

const getContentPositionClasses = (position: string) => {
  const positionMap: Record<string, string> = {
    "top left": "items-start justify-start",
    "top center": "items-center justify-start",
    "top right": "items-end justify-start",
    "center left": "items-start justify-center",
    "center center": "items-center justify-center",
    "center right": "items-end justify-center",
    "bottom left": "items-start justify-end",
    "bottom center": "items-center justify-end",
    "bottom right": "items-end justify-end",
  };
  return positionMap[position] || "items-start justify-start";
};

const TabsLayout = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { tabsData, activeTab, setActiveTab, tabsHeight = 600, rest } = props;
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (activeTab !== displayedTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, displayedTab]);

  const activeTabData = tabsData[activeTab];
  const displayedTabData = tabsData[displayedTab];
  const SubheadingTag = displayedTabData?.subheadingTag || "p";

  if (!(activeTabData && displayedTabData)) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="promotion-tabs relative"
      style={{ height: `${tabsHeight}px` }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      <div className="promotion-tab-content relative h-full w-full overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0">
            <BackgroundImage
              backgroundImage={displayedTabData.backgroundImage}
            />
            <Overlay
              enableOverlay={displayedTabData.enableOverlay}
              overlayColor={displayedTabData.overlayColor}
              overlayColorHover={displayedTabData.overlayColorHover}
              overlayOpacity={displayedTabData.overlayOpacity}
            />
          </div>

          {isTransitioning && activeTab !== displayedTab && (
            <div
              className="absolute inset-0 animate-fadeIn"
              style={{
                animation: "fadeIn 500ms ease-in-out forwards",
              }}
            >
              <BackgroundImage
                backgroundImage={activeTabData.backgroundImage}
              />
              <Overlay
                enableOverlay={activeTabData.enableOverlay}
                overlayColor={activeTabData.overlayColor}
                overlayColorHover={activeTabData.overlayColorHover}
                overlayOpacity={activeTabData.overlayOpacity}
              />
            </div>
          )}
        </div>

        <div className="relative flex h-full flex-col md:flex-col-reverse">
          {/* Content Section */}
          <div
            className={cn(
              "relative z-2 mx-auto flex max-w-(--page-width) flex-1 flex-col gap-4 p-6 transition-all duration-500 ease-in-out sm:h-full sm:p-8",
              getContentPositionClasses(displayedTabData.contentPosition),
              isTransitioning ? "opacity-80" : "opacity-100",
            )}
          >
            <div className="flex flex-col gap-2">
              {displayedTabData.subheadingContent && (
                <SubheadingTag
                  className={`text-${displayedTabData.subheadingAlignment || "left"} ${
                    displayedTabData.subheadingSize === "large"
                      ? "text-lg"
                      : "text-base"
                  } ${
                    displayedTabData.subheadingWeight === "medium"
                      ? "font-medium"
                      : "font-normal"
                  }`}
                  style={{ color: displayedTabData.subheadingColor }}
                >
                  {displayedTabData.subheadingContent}
                </SubheadingTag>
              )}
            </div>
            {displayedTabData.paragraphContent && (
              <Paragraph
                className="ff-heading"
                content={displayedTabData.paragraphContent}
                as={displayedTabData.paragraphTag}
                color={displayedTabData.paragraphColor}
                textSize={displayedTabData.paragraphSize}
                alignment={displayedTabData.paragraphAlignment}
                width={displayedTabData.paragraphWidth}
              />
            )}
            {displayedTabData.buttonContent && (
              <Link
                variant={displayedTabData.variant}
                textColor={displayedTabData.textColor}
                backgroundColor={displayedTabData.backgroundColor}
                borderColor={displayedTabData.borderColor}
                textColorHover={displayedTabData.textColorHover}
                backgroundColorHover={displayedTabData.backgroundColorHover}
                borderColorHover={displayedTabData.borderColorHover}
                textColorDecor={displayedTabData.textColorDecor}
                openInNewTab={displayedTabData.openInNewTab}
                to={displayedTabData.to}
                className="w-fit"
              >
                {displayedTabData.buttonContent}
              </Link>
            )}
          </div>

          {/* Tabs Section */}
          <div className="z-3 flex w-full flex-wrap justify-center gap-2 pt-4 pb-8 md:pt-32 md:pb-0">
            {tabsData.map((tab: any, index: number) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(index)}
                onMouseEnter={() => setActiveTab(index)}
                className={`group relative overflow-hidden transition-all duration-500 ease-in-out ${
                  activeTab === index
                    ? "text-white"
                    : "text-[#918379] hover:text-white"
                }`}
              >
                <div
                  className={`absolute inset-x-0 h-1 origin-center bg-white transition-all duration-500 ease-in-out ${
                    activeTab === index
                      ? "sm:-translate-y-1 bottom-0 opacity-100 sm:top-1"
                      : "sm:group-hover:-translate-y-1 bottom-0 translate-y-1 opacity-0 group-hover:opacity-100 sm:top-1 sm:translate-y-0"
                  }`}
                />

                <span
                  className={`ff-heading relative block px-4 pt-0 pb-1 font-normal text-[26px] transition-all duration-500 ease-in-out sm:px-6 sm:pt-1 sm:pb-0 sm:text-[44px] ${
                    activeTab === index ? "scale-105" : "group-hover:scale-105"
                  }`}
                >
                  {tab.headingContent}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Slider Layout Component
let SliderLayout = forwardRef<HTMLDivElement, any>((props, ref) => {
  let {
    childrenArray,
    totalSlides,
    slidesToShow,
    gap,
    showArrows,
    showDots,
    autoPlay,
    autoPlayDelay,
    swiperKey,
    arrowsIcon,
    iconSize,
    showArrowsOnHover,
    arrowsColor,
    arrowsShape,
    dotsColor,
    rest,
  } = props;

  return (
    <div ref={ref} {...rest} className={variants({ slidesToShow, gap })}>
      <Swiper
        key={swiperKey}
        modules={[Autoplay]}
        spaceBetween={gap}
        slidesPerView={slidesToShow}
        autoplay={
          autoPlay && totalSlides > slidesToShow
            ? {
                delay: autoPlayDelay * 1000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }
            : false
        }
        loop={totalSlides > slidesToShow}
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: gap / 2,
          },
          640: {
            slidesPerView: Math.min(2, slidesToShow),
            spaceBetween: gap,
          },
          768: {
            slidesPerView: Math.min(3, slidesToShow),
            spaceBetween: gap,
          },
          1024: {
            slidesPerView: slidesToShow,
            spaceBetween: gap,
          },
        }}
        className="w-full"
      >
        {childrenArray.map((child: ReactNode, index: number) => {
          return <SwiperSlide key={index}>{child}</SwiperSlide>;
        })}
        {showArrows && totalSlides > slidesToShow && (
          <Arrows
            arrowsIcon={arrowsIcon}
            iconSize={iconSize}
            showArrowsOnHover={showArrowsOnHover}
            arrowsColor={arrowsColor}
            arrowsShape={arrowsShape}
          />
        )}
        {showDots && totalSlides > slidesToShow && (
          <Dots dotsColor={dotsColor} slidesCount={totalSlides} />
        )}
      </Swiper>
    </div>
  );
});

const extractTabsData = (childInstances: any, childrenArray: ReactNode[]) => {
  if (!childrenArray || childrenArray.length === 0) {
    return [];
  }

  return childrenArray.map((child: any, index: number) => {
    const childProps = child?.props || {};

    let instanceData = {};
    if (childInstances && childInstances[index]) {
      try {
        instanceData = childInstances[index].getSnapShot() || {};
      } catch (error) {
        instanceData = {};
      }
    }

    const getValue = (
      propKey: string,
      instanceKey: string,
      defaultValue: any,
    ) => {
      if (childProps[propKey] !== undefined && childProps[propKey] !== null) {
        return childProps[propKey];
      }
      if (
        instanceData[instanceKey] !== undefined &&
        instanceData[instanceKey] !== null
      ) {
        return instanceData[instanceKey];
      }
      return defaultValue;
    };

    return {
      id: getValue("data-wv-id", "id", `tab-${index}`),
      headingContent: getValue("headingContent", "headingContent", "Tab"),
      subheadingContent: getValue("subheadingContent", "subheadingContent", ""),
      paragraphContent: getValue("paragraphContent", "paragraphContent", ""),
      buttonContent: getValue("buttonContent", "buttonContent", ""),
      backgroundImage: getValue("backgroundImage", "backgroundImage", ""),
      contentPosition: getValue(
        "contentPosition",
        "contentPosition",
        "center center",
      ),
      enableOverlay: getValue("enableOverlay", "enableOverlay", true),
      overlayColor: getValue("overlayColor", "overlayColor", "#000000"),
      overlayColorHover: getValue(
        "overlayColorHover",
        "overlayColorHover",
        "#000000",
      ),
      overlayOpacity: getValue("overlayOpacity", "overlayOpacity", 20),
      borderRadius: getValue("borderRadius", "borderRadius", 0),
      to: getValue("to", "to", ""),
      variant: getValue("variant", "variant", "decor"),
      openInNewTab: getValue("openInNewTab", "openInNewTab", false),
      textColor: getValue("textColor", "textColor", "#ffffff"),
      backgroundColor: getValue(
        "backgroundColor",
        "backgroundColor",
        "transparent",
      ),
      borderColor: getValue("borderColor", "borderColor", "#ffffff"),
      textColorHover: getValue("textColorHover", "textColorHover", "#ffffff"),
      backgroundColorHover: getValue(
        "backgroundColorHover",
        "backgroundColorHover",
        "transparent",
      ),
      borderColorHover: getValue(
        "borderColorHover",
        "borderColorHover",
        "#ffffff",
      ),
      textColorDecor: getValue("textColorDecor", "textColorDecor", ""),
      // Heading props
      color: getValue("color", "color", "#ffffff"),
      size: getValue("size", "size", "3xl"),
      mobileSize: getValue("mobileSize", "mobileSize", "2xl"),
      desktopSize: getValue("desktopSize", "desktopSize", "3xl"),
      weight: getValue("weight", "weight", "normal"),
      letterSpacing: getValue("letterSpacing", "letterSpacing", "normal"),
      alignment: getValue("alignment", "alignment", "left"),
      minSize: getValue("minSize", "minSize", "lg"),
      maxSize: getValue("maxSize", "maxSize", "5xl"),
      animate: getValue("animate", "animate", true),
      headingTagName: getValue("headingTagName", "headingTagName", "h2"),
      // Paragraph props
      paragraphTag: getValue("paragraphTag", "paragraphTag", "p"),
      paragraphColor: getValue("paragraphColor", "paragraphColor", "#ffffff"),
      paragraphSize: getValue("paragraphSize", "paragraphSize", "base"),
      paragraphAlignment: getValue(
        "paragraphAlignment",
        "paragraphAlignment",
        "left",
      ),
      paragraphWidth: getValue("paragraphWidth", "paragraphWidth", "full"),
      // Subheading props
      subheadingTag: getValue("subheadingTag", "subheadingTag", "p"),
      subheadingColor: getValue(
        "subheadingColor",
        "subheadingColor",
        "#ffffff",
      ),
      subheadingSize: getValue("subheadingSize", "subheadingSize", "base"),
      subheadingWeight: getValue(
        "subheadingWeight",
        "subheadingWeight",
        "normal",
      ),
      subheadingAlignment: getValue(
        "subheadingAlignment",
        "subheadingAlignment",
        "left",
      ),
    };
  });
};

let PromotionSlider = forwardRef<HTMLDivElement, GridItemProps>(
  (props, ref) => {
    let {
      children,
      layout = "slider",
      slidesToShow = 2,
      gap = 20,
      autoPlay = false,
      autoPlayDelay = 5,
      showDots = true,
      showArrows = true,
      arrowsIcon = "caret",
      iconSize = 24,
      showArrowsOnHover = false,
      arrowsColor = "white",
      arrowsShape = "circle",
      dotsColor = "light",
      tabsHeight = 600,
      ...rest
    } = props;

    let [swiperKey, setSwiperKey] = useState(0);
    let [activeTab, setActiveTab] = useState(0);
    let [refreshKey, setRefreshKey] = useState(0);
    let childInstances = useChildInstances();

    let childrenArray = Array.isArray(children)
      ? (children as ReactNode[])
      : children
        ? [children as ReactNode]
        : [];
    let totalSlides = childrenArray.length;

    useEffect(() => {
      if (layout === "tabs" && childInstances?.length > 0) {
        let checkInterval = setInterval(() => {
          setRefreshKey((prev) => {
            return prev + 1;
          });
        }, 1000);

        return () => {
          return clearInterval(checkInterval);
        };
      }
    }, [layout, childInstances, childrenArray]);

    let childrenKey = useMemo(() => {
      return childrenArray
        .map((child: any) => {
          return (
            child?.props?.["data-wv-id"] ||
            `child-${Math.random().toString(36).slice(2, 11)}`
          );
        })
        .join("-");
    }, [childrenArray]);

    useEffect(() => {
      if (layout === "tabs") {
        setRefreshKey((prev) => {
          return prev + 1;
        });
      }
    }, [layout, childrenKey]);

    let tabsData = useMemo(() => {
      return layout === "tabs"
        ? extractTabsData(childInstances, childrenArray)
        : [];
    }, [childInstances, childrenArray, layout, refreshKey]);

    useEffect(() => {
      setSwiperKey((prev) => {
        return prev + 1;
      });
    }, [slidesToShow, showDots, showArrows, autoPlay, autoPlayDelay]);

    if (totalSlides === 0) {
      return (
        <div ref={ref} {...rest} className={variants({ slidesToShow, gap })} />
      );
    }

    if (layout === "tabs") {
      return (
        <TabsLayout
          ref={ref}
          tabsData={tabsData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabsHeight={tabsHeight}
          rest={rest}
        />
      );
    }

    return (
      <SliderLayout
        ref={ref}
        childrenArray={childrenArray}
        totalSlides={totalSlides}
        slidesToShow={slidesToShow}
        gap={gap}
        showArrows={showArrows}
        showDots={showDots}
        autoPlay={autoPlay}
        autoPlayDelay={autoPlayDelay}
        swiperKey={swiperKey}
        arrowsIcon={arrowsIcon}
        iconSize={iconSize}
        showArrowsOnHover={showArrowsOnHover}
        arrowsColor={arrowsColor}
        arrowsShape={arrowsShape}
        dotsColor={dotsColor}
        rest={rest}
      />
    );
  },
);

export default PromotionSlider;

export let schema = createSchema({
  type: "grid-items",
  title: "Promotion slider",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout type",
          configs: {
            options: [
              { value: "slider", label: "Slider" },
              { value: "tabs", label: "Tabs" },
            ],
          },
          defaultValue: "slider",
        },
        {
          type: "range",
          name: "tabsHeight",
          label: "Tabs height",
          configs: {
            min: 400,
            max: 1000,
            step: 50,
            unit: "px",
          },
          defaultValue: 600,
          condition: "layout.eq.tabs",
        },
      ],
    },
    {
      group: "Slider",
      inputs: [
        {
          type: "range",
          name: "slidesToShow",
          label: "Slides to show",
          configs: {
            min: 1,
            max: 4,
            step: 1,
          },
          defaultValue: 2,
          condition: "layout.eq.slider",
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
          condition: "layout.eq.slider",
        },
        {
          type: "switch",
          name: "autoPlay",
          label: "Auto play",
          defaultValue: false,
          condition: "layout.eq.slider",
        },
        {
          type: "range",
          name: "autoPlayDelay",
          label: "Auto play delay",
          configs: {
            min: 2,
            max: 10,
            step: 1,
            unit: "s",
          },
          defaultValue: 5,
          condition: "autoPlay.eq.true",
        },
      ],
    },
    {
      group: "Navigation",
      inputs: [
        {
          type: "heading",
          label: "Arrows",
        },
        {
          type: "switch",
          name: "showArrows",
          label: "Show arrows",
          defaultValue: true,
          condition: "layout.eq.slider",
        },
        {
          type: "select",
          name: "arrowsIcon",
          label: "Arrow icon",
          configs: {
            options: [
              { value: "caret", label: "Caret" },
              { value: "arrow", label: "Arrow" },
            ],
          },
          defaultValue: "caret",
          condition: "showArrows.eq.true",
        },
        {
          type: "range",
          name: "iconSize",
          label: "Icon size",
          configs: {
            min: 16,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 24,
          condition: "showArrows.eq.true",
        },
        {
          type: "switch",
          name: "showArrowsOnHover",
          label: "Show arrows on hover",
          defaultValue: false,
          condition: "showArrows.eq.true",
        },
        {
          type: "select",
          name: "arrowsColor",
          label: "Arrows color",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "white", label: "White" },
            ],
          },
          defaultValue: "white",
          condition: "showArrows.eq.true",
        },
        {
          type: "toggle-group",
          name: "arrowsShape",
          label: "Arrows shape",
          configs: {
            options: [
              { value: "square", label: "Square", icon: "square" },
              { value: "rounded", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
            ],
          },
          defaultValue: "circle",
          condition: "showArrows.eq.true",
        },
        {
          type: "heading",
          label: "Dots",
        },
        {
          type: "switch",
          name: "showDots",
          label: "Show dots",
          defaultValue: true,
          condition: "layout.eq.slider",
        },
        {
          type: "select",
          name: "dotsColor",
          label: "Dots color",
          configs: {
            options: [
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ],
          },
          defaultValue: "dark",
          condition: "showDots.eq.true",
        },
      ],
    },
  ],
  childTypes: ["promotion-grid-item"],
  presets: {
    layout: "slider",
    slidesToShow: 2,
    gap: 20,
    autoPlay: false,
    autoPlayDelay: 5,
    showDots: true,
    showArrows: true,
    arrowsIcon: "caret",
    iconSize: 24,
    showArrowsOnHover: false,
    arrowsColor: "white",
    arrowsShape: "circle",
    dotsColor: "light",
    tabsHeight: 600,
    children: [
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_1,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        headingContent: "Heading",
        paragraphContent:
          "From mid-century modern to contemporary, our design language is intentionally universal; we design so you can settle in, comfortably, for the long haul.",
        buttonContent: "Shop now",
        variant: "decor",
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_2,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        headingContent: "Heading",
        paragraphContent:
          "From mid-century modern to contemporary, our design language is intentionally universal; we design so you can settle in, comfortably, for the long haul.",
        buttonContent: "Shop promotion",
        variant: "decor",
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        headingContent: "Heading",
        paragraphContent:
          "From mid-century modern to contemporary, our design language is intentionally universal; we design so you can settle in, comfortably, for the long haul.",
        buttonContent: "Explore Now",
        variant: "decor",
      },
    ],
  },
});
