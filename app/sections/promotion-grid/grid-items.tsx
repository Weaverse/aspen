import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
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
  useRef,
  useState,
} from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BackgroundImage } from "~/components/background-image";
// import Heading from "~/components/heading";
import Link from "~/components/link";
import { Overlay } from "~/components/overlay";
import Paragraph from "~/components/paragraph";
import type { SectionProps } from "~/components/section";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type GridItemProps = VariantProps<typeof variants> &
  SectionProps & {
    layout?: "slider" | "tabs";
    slidesToShow?: number;
    autoPlay?: boolean;
    autoPlayDelay?: number;
    enableDots?: boolean;
    enableNavigation?: boolean;
  };

let variants = cva("promotion-slider relative px-5 md:px-8", {
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

// Tabs Layout Component
const TabsLayout = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { tabsData, activeTab, setActiveTab, rest } = props;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Handle smooth tab transitions
  useEffect(() => {
    if (activeTab !== currentTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentTab(activeTab);
        setIsTransitioning(false);
      }, 300); // Half the total transition time
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentTab]);

  const activeTabData = tabsData[currentTab];
  const SubheadingTag = activeTabData?.subheadingTag || "p";

  if (!activeTabData) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="promotion-tabs relative aspect-video px-5 md:px-8"
    >
      {/* Tab Content */}
      <div className="promotion-tab-content relative h-full w-full overflow-hidden">
        {/* Background and Overlay */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <BackgroundImage backgroundImage={activeTabData.backgroundImage} />
            <Overlay
              enableOverlay={activeTabData.enableOverlay}
              overlayColor={activeTabData.overlayColor}
              overlayColorHover={activeTabData.overlayColorHover}
              overlayOpacity={activeTabData.overlayOpacity}
            />
          </div>
        </div>

        <div className="relative flex h-full flex-col">
          {/* Tab Navigation */}
          <div className="z-3 flex w-full flex-wrap justify-center gap-2 pt-32">
            {tabsData.map((tab: any, index: number) => (
              <button
                key={tab.id}
                type="button"
                onMouseEnter={() => setActiveTab(index)}
                className={`group relative overflow-hidden transition-all duration-500 ease-in-out ${
                  activeTab === index
                    ? "text-white"
                    : "text-[#918379] hover:text-white"
                }`}
              >
                {/* Border animation - slides down from center */}
                <div
                  className={`absolute inset-x-0 top-1 h-1 origin-center bg-white transition-all duration-500 ease-in-out ${
                    activeTab === index
                      ? "-translate-y-1 opacity-100"
                      : "group-hover:-translate-y-1 translate-y-0 opacity-0 group-hover:opacity-100"
                  }`}
                />

                {/* Text animation - subtle scale effect */}
                <span
                  className={`ff-heading relative block px-6 pt-1 font-normal text-2xl transition-all duration-500 ease-in-out ${
                    activeTab === index ? "scale-105" : "group-hover:scale-105"
                  }`}
                >
                  {tab.headingContent}
                </span>
              </button>
            ))}
          </div>

          {/* Content with smooth fade transition */}
          <div
            className={`relative z-2 flex h-full flex-col gap-4 p-8 transition-all duration-600 ease-in-out ${getContentPositionClasses(
              activeTabData.contentPosition,
            )} ${
              isTransitioning
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div className="flex flex-col gap-2">
              {activeTabData.subheadingContent && (
                <SubheadingTag
                  className={`text-${activeTabData.subheadingAlignment || "left"} ${
                    activeTabData.subheadingSize === "large"
                      ? "text-lg"
                      : "text-base"
                  } ${
                    activeTabData.subheadingWeight === "medium"
                      ? "font-medium"
                      : "font-normal"
                  }`}
                  style={{ color: activeTabData.subheadingColor }}
                >
                  {activeTabData.subheadingContent}
                </SubheadingTag>
              )}
            </div>
            {activeTabData.paragraphContent && (
              <Paragraph
                content={activeTabData.paragraphContent}
                as={activeTabData.paragraphTag}
                color={activeTabData.paragraphColor}
                textSize={activeTabData.paragraphSize}
                alignment={activeTabData.paragraphAlignment}
                width={activeTabData.paragraphWidth}
              />
            )}
            {activeTabData.buttonContent && (
              <Link
                variant={activeTabData.variant}
                textColor={activeTabData.textColor}
                backgroundColor={activeTabData.backgroundColor}
                borderColor={activeTabData.borderColor}
                textColorHover={activeTabData.textColorHover}
                backgroundColorHover={activeTabData.backgroundColorHover}
                borderColorHover={activeTabData.borderColorHover}
                textColorDecor={activeTabData.textColorDecor}
                openInNewTab={activeTabData.openInNewTab}
                to={activeTabData.to}
                className="w-fit"
              >
                {activeTabData.buttonContent}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Slider Layout Component
const SliderLayout = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    childrenArray,
    totalSlides,
    slidesToShow,
    gap,
    enableNavigation,
    enableDots,
    autoPlay,
    autoPlayDelay,
    swiperKey,
    swiperRef,
    prevButtonRef,
    nextButtonRef,
    handlePrevClick,
    handleNextClick,
    rest,
  } = props;

  return (
    <div ref={ref} {...rest} className={variants({ slidesToShow, gap })}>
      {/* Custom Swiper Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .promotion-slider .swiper-pagination-bullet {
            width: 12px !important;
            height: 12px !important;
            background: rgb(209 213 219) !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            opacity: 1 !important;
          }
          .promotion-slider .swiper-pagination-bullet:hover {
            background: rgb(107 114 128) !important;
          }
          .promotion-slider .swiper-pagination-bullet-active {
            background: rgb(31 41 55) !important;
            transform: scale(1.1) !important;
          }
          .promotion-slider .swiper-pagination-custom {
            position: static !important;
          }
        `,
        }}
      />

      {enableNavigation && totalSlides > slidesToShow && (
        <>
          <button
            ref={prevButtonRef}
            type="button"
            onClick={handlePrevClick}
            className="swiper-button-prev-custom -translate-y-1/2 absolute top-1/2 left-2 z-10 rounded-full bg-white/90 p-3 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-800" />
          </button>
          <button
            ref={nextButtonRef}
            type="button"
            onClick={handleNextClick}
            className="swiper-button-next-custom -translate-y-1/2 absolute top-1/2 right-2 z-10 rounded-full bg-white/90 p-3 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRightIcon className="h-6 w-6 text-gray-800" />
          </button>
        </>
      )}

      <Swiper
        key={swiperKey}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={gap}
        slidesPerView={slidesToShow}
        navigation={
          enableNavigation
            ? {
                prevEl: prevButtonRef.current,
                nextEl: nextButtonRef.current,
              }
            : false
        }
        pagination={
          enableDots
            ? {
                clickable: true,
                bulletClass: "swiper-pagination-bullet",
                bulletActiveClass: "swiper-pagination-bullet-active",
                el: ".swiper-pagination-custom",
              }
            : false
        }
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
        {childrenArray.map((child: ReactNode, index: number) => (
          <SwiperSlide key={index}>{child}</SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Pagination Dots */}
      {enableDots && totalSlides > slidesToShow && (
        <div className="swiper-pagination-custom mt-6 flex justify-center space-x-2" />
      )}
    </div>
  );
});

const extractTabsData = (childInstances: any, childrenArray: ReactNode[]) => {
  if (!childrenArray || childrenArray.length === 0) {
    return [];
  }

  // Extract data from both child instances and direct props
  // Prioritize direct props for real-time updates, fallback to instance data
  return childrenArray.map((child: any, index: number) => {
    // Get data directly from child props first for real-time updates
    const childProps = child?.props || {};

    // Try to get data from child instances as fallback
    let instanceData = {};
    if (childInstances && childInstances[index]) {
      try {
        instanceData = childInstances[index].getSnapShot() || {};
      } catch (error) {
        // If getSnapShot fails, use empty object
        instanceData = {};
      }
    }

    // Helper function to get value with proper fallback
    const getValue = (
      propKey: string,
      instanceKey: string,
      defaultValue: any,
    ) => {
      // First try direct props (real-time)
      if (childProps[propKey] !== undefined && childProps[propKey] !== null) {
        return childProps[propKey];
      }
      // Then try instance data (fallback)
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
    const {
      children,
      layout = "slider",
      slidesToShow = 2,
      gap = 20,
      autoPlay = false,
      autoPlayDelay = 5000,
      enableDots = true,
      enableNavigation = true,
      ...rest
    } = props;

    const [swiperKey, setSwiperKey] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const swiperRef = useRef<SwiperType | null>(null);
    const prevButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    const childInstances = useChildInstances();

    const childrenArray = Array.isArray(children)
      ? (children as ReactNode[])
      : children
        ? [children as ReactNode]
        : [];
    const totalSlides = childrenArray.length;

    // Monitor child instances for changes in tab layout
    useEffect(() => {
      if (layout === "tabs" && childInstances?.length > 0) {
        // Create a monitoring mechanism to detect changes in child instances
        const checkInterval = setInterval(() => {
          // Force a re-render by updating refresh key
          setRefreshKey((prev) => prev + 1);
        }, 1000); // Check every second

        return () => clearInterval(checkInterval);
      }
    }, [layout, childInstances, childrenArray]);

    // Create a stable key for children to detect changes
    const childrenKey = useMemo(() => {
      return childrenArray
        .map(
          (child: any) =>
            child?.props?.["data-wv-id"] ||
            `child-${Math.random().toString(36).slice(2, 11)}`,
        )
        .join("-");
    }, [childrenArray]);

    // Force refresh when layout is tabs and children might have changed
    useEffect(() => {
      if (layout === "tabs") {
        setRefreshKey((prev) => prev + 1);
      }
    }, [layout, childrenKey]);

    const tabsData = useMemo(
      () =>
        layout === "tabs" ? extractTabsData(childInstances, childrenArray) : [],
      [childInstances, childrenArray, layout, refreshKey],
    );

    useEffect(() => {
      setSwiperKey((prev) => prev + 1);
    }, [slidesToShow, enableDots, enableNavigation, autoPlay, autoPlayDelay]);

    if (totalSlides === 0) {
      return (
        <div ref={ref} {...rest} className={variants({ slidesToShow, gap })} />
      );
    }

    const handlePrevClick = () => {
      if (swiperRef.current) {
        swiperRef.current.slidePrev();
      }
    };

    const handleNextClick = () => {
      if (swiperRef.current) {
        swiperRef.current.slideNext();
      }
    };

    if (layout === "tabs") {
      return (
        <TabsLayout
          ref={ref}
          tabsData={tabsData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
        enableNavigation={enableNavigation}
        enableDots={enableDots}
        autoPlay={autoPlay}
        autoPlayDelay={autoPlayDelay}
        swiperKey={swiperKey}
        swiperRef={swiperRef}
        prevButtonRef={prevButtonRef}
        nextButtonRef={nextButtonRef}
        handlePrevClick={handlePrevClick}
        handleNextClick={handleNextClick}
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
          label: "Auto play delay (seconds)",
          configs: {
            min: 2,
            max: 10,
            step: 1,
            unit: "s",
          },
          defaultValue: 5,
          condition: "autoPlay.eq.true",
        },
        {
          type: "switch",
          name: "enableDots",
          label: "Show dots",
          defaultValue: true,
          condition: "layout.eq.slider",
        },
        {
          type: "switch",
          name: "enableNavigation",
          label: "Show navigation arrows",
          defaultValue: true,
          condition: "layout.eq.slider",
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
    enableDots: true,
    enableNavigation: true,
    children: [
      {
        type: "promotion-grid-item",
        contentPosition: "top left",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_1,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        headingContent: "Announce your promotion",
        paragraphContent:
          "Include the smaller details of your promotion in text below the title.",
        buttonContent: "Shop now",
        variant: "decor",
      },
      {
        type: "promotion-grid-item",
        contentPosition: "bottom right",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_2,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        headingContent: "Announce your promotion",
        paragraphContent:
          "Include the smaller details of your promotion in text below the title.",
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
        headingContent: "New Collection",
        paragraphContent: "Discover our latest products and exclusive offers.",
        buttonContent: "Explore Now",
        variant: "decor",
      },
    ],
  },
});
