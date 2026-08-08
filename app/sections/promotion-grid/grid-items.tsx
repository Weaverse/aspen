import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useChildInstances,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  forwardRef,
  isValidElement,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Autoplay, Navigation } from "swiper/modules";
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
    mobileTabsHeight?: number;
    sliderHeading?: string;
    sliderDescription?: string;
  };

let variants = cva(
  "promotion-slider group relative mx-auto w-full max-w-[1376px] px-5 md:px-0",
  {
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
  },
);

const TabsLayout = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    tabsData,
    activeTab,
    setActiveTab,
    tabsHeight = 840,
    mobileTabsHeight = 562,
    rest,
  } = props;
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
      className="promotion-tabs relative isolate h-[var(--promotion-tabs-mobile-height)] overflow-hidden md:h-[var(--promotion-tabs-height)]"
      style={
        {
          "--promotion-tabs-height": `${tabsHeight}px`,
          "--promotion-tabs-mobile-height": `${mobileTabsHeight}px`,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0">
        <BackgroundImage backgroundImage={displayedTabData.backgroundImage} />
        <Overlay
          enableOverlay={displayedTabData.enableOverlay}
          overlayColor={displayedTabData.overlayColor}
          overlayColorHover={displayedTabData.overlayColorHover}
          overlayOpacity={displayedTabData.overlayOpacity}
        />
      </div>

      {isTransitioning && activeTab !== displayedTab && (
        <div className="absolute inset-0 animate-fade-in">
          <BackgroundImage backgroundImage={activeTabData.backgroundImage} />
          <Overlay
            enableOverlay={activeTabData.enableOverlay}
            overlayColor={activeTabData.overlayColor}
            overlayColorHover={activeTabData.overlayColorHover}
            overlayOpacity={activeTabData.overlayOpacity}
          />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 top-12 z-2 mx-auto flex max-w-[335px] flex-col items-center text-center transition-opacity duration-500 md:top-[420px] md:max-w-[680px]",
          isTransitioning ? "opacity-80" : "opacity-100",
        )}
      >
        {displayedTabData.subheadingContent && (
          <SubheadingTag
            className="mb-4 font-body text-sm"
            style={{ color: displayedTabData.subheadingColor }}
          >
            {displayedTabData.subheadingContent}
          </SubheadingTag>
        )}
        {displayedTabData.paragraphContent && (
          <Paragraph
            className="ff-heading !mx-auto w-full text-[24px] leading-[1.15] md:text-[26px]"
            content={displayedTabData.paragraphContent}
            as={displayedTabData.paragraphTag}
            color={displayedTabData.paragraphColor}
            alignment="center"
            width="full"
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
            className="mt-12 w-fit"
            style={{
              color: displayedTabData.buttonTextColor,
              fontSize: `${displayedTabData.buttonTextSize}px`,
            }}
          >
            {displayedTabData.buttonContent}
          </Link>
        )}
      </div>

      <div className="absolute top-[373px] right-8 left-8 z-3 flex flex-col md:top-40 md:right-0 md:left-0 md:mx-auto md:grid md:w-[calc(100%-288px)] md:max-w-[1440px] md:grid-cols-3 md:gap-5">
        {tabsData.map((tab: any, index: number) => {
          const isActive = activeTab === index;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(index)}
              onMouseEnter={() => setActiveTab(index)}
              className={cn(
                "group flex h-[49px] w-full items-start justify-center border-t-4 pt-3 transition-colors duration-300 md:h-auto md:pt-4",
                isActive
                  ? "border-[#D8D8D8] text-(--color-text-inverse)"
                  : "border-transparent text-[#979797] hover:text-(--color-text-inverse)",
              )}
            >
              <span className="font-heading text-[26px] leading-none tracking-[-0.025em] md:text-[44px]">
                {tab.headingContent}
              </span>
            </button>
          );
        })}
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
        modules={[Autoplay, Navigation]}
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
        navigation={{
          nextEl: ".promotion-arrow-next",
          prevEl: ".promotion-arrow-prev",
        }}
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
        {showDots && totalSlides > slidesToShow && (
          <Dots dotsColor={dotsColor} slidesCount={totalSlides} />
        )}
      </Swiper>
      {showArrows && totalSlides > slidesToShow && (
        <Arrows
          arrowsIcon={arrowsIcon}
          iconSize={iconSize}
          showArrowsOnHover={showArrowsOnHover}
          arrowsColor={arrowsColor}
          arrowsShape={arrowsShape}
        />
      )}
    </div>
  );
});

const extractTabsData = (childrenData: any[]) => {
  if (!childrenData || childrenData.length === 0) {
    return [];
  }

  return childrenData.map((child: any, index: number) => {
    const childProps = child?.props || child || {};

    const getValue = (propKey: string, defaultValue: any) => {
      if (childProps[propKey] !== undefined && childProps[propKey] !== null) {
        return childProps[propKey];
      }
      return defaultValue;
    };

    return {
      id: getValue("data-wv-id", `tab-${index}`),
      headingContent: getValue("tabLabel", getValue("headingContent", "Tab")),
      subheadingContent: getValue("subheadingContent", ""),
      paragraphContent: getValue(
        "tabParagraphContent",
        getValue("paragraphContent", ""),
      ),
      buttonContent: getValue(
        "tabButtonContent",
        getValue("buttonContent", ""),
      ),
      backgroundImage: getValue("backgroundImage", ""),
      contentPosition: getValue("contentPosition", "center center"),
      enableOverlay: getValue("enableOverlay", true),
      overlayColor: getValue(
        "tabOverlayColor",
        getValue("overlayColor", "#1A1A1A"),
      ),
      overlayColorHover: getValue("overlayColorHover", "#000000"),
      overlayOpacity: getValue(
        "tabOverlayOpacity",
        getValue("overlayOpacity", 60),
      ),
      borderRadius: getValue("borderRadius", 0),
      to: getValue("to", ""),
      variant: getValue("variant", "decor"),
      openInNewTab: getValue("openInNewTab", false),
      textColor: getValue("textColor", "#ffffff"),
      backgroundColor: getValue("backgroundColor", "transparent"),
      borderColor: getValue("borderColor", "#ffffff"),
      textColorHover: getValue("textColorHover", "#ffffff"),
      backgroundColorHover: getValue("backgroundColorHover", "transparent"),
      borderColorHover: getValue("borderColorHover", "#ffffff"),
      textColorDecor: getValue("textColorDecor", "#FEF4EB"),
      buttonTextColor: getValue("buttonTextColor", "#FEF4EB"),
      buttonTextSize: getValue("buttonTextSize", 12),
      // Heading props
      color: getValue("color", "#ffffff"),
      size: getValue("size", "3xl"),
      mobileSize: getValue("mobileSize", "2xl"),
      desktopSize: getValue("desktopSize", "3xl"),
      weight: getValue("weight", "400"),
      letterSpacing: getValue("letterSpacing", "normal"),
      alignment: getValue("alignment", "left"),
      minSize: getValue("minSize", "lg"),
      maxSize: getValue("maxSize", "5xl"),
      animate: getValue("animate", true),
      headingTagName: getValue("headingTagName", "h2"),
      // Paragraph props
      paragraphTag: getValue("paragraphTag", "p"),
      paragraphColor: getValue("paragraphColor", "#ffffff"),
      paragraphSize: getValue("paragraphSize", "base"),
      paragraphAlignment: getValue("paragraphAlignment", "left"),
      paragraphWidth: getValue("paragraphWidth", "full"),
      // Subheading props
      subheadingTag: getValue("subheadingTag", "p"),
      subheadingColor: getValue("subheadingColor", "#ffffff"),
      subheadingSize: getValue("subheadingSize", "base"),
      subheadingWeight: getValue("subheadingWeight", "normal"),
      subheadingAlignment: getValue("subheadingAlignment", "left"),
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
      tabsHeight = 840,
      mobileTabsHeight = 562,
      sliderHeading = "EXPLORE MORE",
      sliderDescription = "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
      ...rest
    } = props;

    let [swiperKey, setSwiperKey] = useState(0);
    let [activeTab, setActiveTab] = useState(0);
    const childInstances = useChildInstances();

    let childrenArray = Array.isArray(children)
      ? (children as ReactNode[])
      : children
        ? [children as ReactNode]
        : [];
    let totalSlides = childrenArray.length;

    const tabSources = childrenArray.map((child, index) => {
      const instanceData = childInstances[index]?.data || {};
      const renderedProps = isValidElement<Record<string, unknown>>(child)
        ? child.props
        : {};
      // Studio updates child instance data before rendered child props refresh.
      // Prefer it so Scenario 2 copy changes immediately in the preview.
      return { ...renderedProps, ...instanceData };
    });
    let tabsData =
      layout === "tabs"
        ? extractTabsData(tabSources.length ? tabSources : childrenArray)
        : [];

    useEffect(() => {
      setSwiperKey((prev) => {
        return prev + 1;
      });
    }, [slidesToShow, showDots, showArrows, autoPlay, autoPlayDelay]);

    useEffect(() => {
      setActiveTab((current) =>
        Math.min(current, Math.max(0, totalSlides - 1)),
      );
    }, [totalSlides]);

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
          mobileTabsHeight={mobileTabsHeight}
          rest={rest}
        />
      );
    }

    return (
      <div ref={ref} {...rest} className="bg-[#F0F0EF] py-20">
        <div className="mx-auto mb-8 flex max-w-[650px] flex-col items-center gap-6 px-5 text-center">
          <h2 className="font-heading text-[36px] leading-[1.1] tracking-[-0.025em] md:text-[44px]">
            {sliderHeading}
          </h2>
          <Paragraph
            content={sliderDescription}
            alignment="center"
            width="full"
            className="font-body text-sm leading-[1.55]"
          />
        </div>
        <SliderLayout
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
          rest={{}}
        />
      </div>
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
          label: "Tabs height (desktop)",
          configs: {
            min: 400,
            max: 1000,
            step: 50,
            unit: "px",
          },
          defaultValue: 840,
          condition: "layout.eq.tabs",
        },
        {
          type: "range",
          name: "mobileTabsHeight",
          label: "Tabs height (mobile)",
          configs: {
            min: 480,
            max: 800,
            step: 2,
            unit: "px",
          },
          defaultValue: 562,
          condition: "layout.eq.tabs",
        },
      ],
    },
    {
      group: "Slider heading",
      inputs: [
        {
          type: "text",
          name: "sliderHeading",
          label: "Heading",
          defaultValue: "EXPLORE MORE",
          condition: "layout.eq.slider",
        },
        {
          type: "richtext",
          name: "sliderDescription",
          label: "Description",
          defaultValue:
            "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
          condition: "layout.eq.slider",
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
    showDots: false,
    showArrows: true,
    arrowsIcon: "caret",
    iconSize: 24,
    showArrowsOnHover: false,
    arrowsColor: "white",
    arrowsShape: "rounded",
    dotsColor: "light",
    tabsHeight: 840,
    mobileTabsHeight: 562,
    sliderHeading: "EXPLORE MORE",
    sliderDescription:
      "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
    children: [
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_1,
        borderRadius: 12,
        enableOverlay: true,
        overlayColor: "#202020",
        overlayColorHover: "#A3A3A3",
        overlayOpacity: 50,
        headingContent:
          "The best of every modern style from minimalist to mid century.",
        size: "scale",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "/collections/best-sellers",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Best Selling",
        tabParagraphContent:
          "From mid-century modern to contemporary, our design language is intentionally universal; we design so you can settle in, comfortably, for the long haul.",
        tabButtonContent: "EXPLORE NOW",
        tabOverlayColor: "#1A1A1A",
        tabOverlayOpacity: 60,
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_2,
        borderRadius: 12,
        enableOverlay: true,
        overlayColor: "#202020",
        overlayColorHover: "#A3A3A3",
        overlayOpacity: 50,
        headingContent:
          "Quality furniture made to last through moves and milestones.",
        size: "scale",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "/collections/sofa-beds",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Sofa Beds",
        tabParagraphContent:
          "Generous comfort by day, a welcoming place to stay by night. Designed to transform with ease.",
        tabButtonContent: "EXPLORE NOW",
        tabOverlayColor: "#1A1A1A",
        tabOverlayOpacity: 60,
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
        borderRadius: 12,
        enableOverlay: true,
        overlayColor: "#202020",
        overlayColorHover: "#A3A3A3",
        overlayOpacity: 50,
        headingContent: "Finishing touches for a home that feels like yours.",
        size: "scale",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "/collections/decorations",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Decorations",
        tabParagraphContent:
          "The finishing touches that bring warmth, texture, and personality to every room.",
        tabButtonContent: "EXPLORE NOW",
        tabOverlayColor: "#1A1A1A",
        tabOverlayOpacity: 60,
      },
    ],
  },
});
