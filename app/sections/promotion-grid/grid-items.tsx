import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useChildInstances,
  useTranslation,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  forwardRef,
  isValidElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BackgroundImage } from "~/components/background-image";
import Link from "~/components/link";
import { Overlay } from "~/components/overlay";
import Paragraph from "~/components/paragraph";
import type { SectionProps } from "~/components/section";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { translatePresetText } from "~/utils/translation";
import "swiper/css";
import { DESKTOP_MIN_PX, TABLET_MIN_PX } from "~/utils/breakpoints";
import { cn } from "~/utils/cn";
import { sectionImageSource } from "~/utils/section-placeholder";
import type { PromotionArrowsProps } from "./arrows";
import { Arrows } from "./arrows";
import type { PromotionDotsProps } from "./dots";
import { Dots } from "./dots";
import { usePromotionGridLayout } from "./index";

type GridItemProps = VariantProps<typeof variants> &
  SectionProps &
  PromotionArrowsProps &
  PromotionDotsProps & {
    layout?: "slider" | "tabs";
    slidesToShow?: number;
    tabletGap?: number;
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
  "promotion-slider group relative mx-auto w-full min-w-0 max-w-360 px-5 md:px-8",
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
  const { t } = useTranslation();

  const {
    tabsData,
    activeTab,
    setActiveTab,
    tabsHeight = 840,
    mobileTabsHeight = 562,
    rest,
  } = props;
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const isTransitioning = activeTab !== displayedTab;

  useEffect(() => {
    if (activeTab !== displayedTab) {
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, displayedTab]);

  const activeTabData = tabsData[activeTab];
  const displayedTabData = tabsData[displayedTab];
  const SubheadingTag = activeTabData?.subheadingTag || "p";

  if (!(activeTabData && displayedTabData)) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="promotion-tabs relative isolate flex min-h-(--promotion-tabs-mobile-height) min-w-0 flex-col overflow-hidden md:min-h-0 md:gap-16 md:pt-10 md:pb-20 lg:min-h-(--promotion-tabs-height) lg:gap-[200px] lg:pt-40"
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

      <div className="relative z-2 mx-auto flex w-full min-w-0 max-w-180 flex-col items-center px-6 py-12 text-center md:order-2 md:w-[calc(100%-var(--spacing)*16)] md:p-0">
        {activeTabData.subheadingContent && (
          <SubheadingTag
            className="mb-4 font-body text-sm"
            style={{ color: activeTabData.subheadingColor }}
          >
            {activeTabData.subheadingContent}
          </SubheadingTag>
        )}
        {activeTabData.paragraphContent && (
          <Paragraph
            className="ff-heading !mx-auto w-full min-w-0 break-words text-2xl leading-[normal]"
            content={activeTabData.paragraphContent}
            as={activeTabData.paragraphTag}
            color={activeTabData.paragraphColor}
            alignment="center"
            width="full"
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
            className={cn(
              "mt-10 w-fit",
              activeTabData.variant === "decor" && "p-1",
            )}
            style={{
              color: activeTabData.buttonTextColor,
              fontSize: `${activeTabData.buttonTextSize}px`,
            }}
          >
            {activeTabData.buttonContent}
          </Link>
        )}
      </div>

      <div className="relative z-3 mx-auto flex w-full min-w-0 flex-col gap-5 px-8 pt-10 pb-12 md:order-1 md:grid md:w-[calc(100%-64px)] md:max-w-360 md:grid-cols-3 md:p-0">
        {tabsData.map((tab: any, index: number) => {
          const isActive = activeTab === index;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTab(index)}
              onMouseEnter={() => setActiveTab(index)}
              className={cn(
                "group flex min-w-0 w-full items-start justify-center transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
                isActive
                  ? "border-t-4 border-line-subtle pt-2.5 text-(--color-text-inverse)"
                  : "text-(--color-text-light) hover:text-(--color-text-inverse)",
              )}
            >
              <span className="min-w-0 break-words text-center font-heading text-(length:--h6-base-size) leading-[1.1] tracking-[-0.02em] lg:text-(length:--h3-base-size) lg:tracking-[-0.03em]">
                {tab.headingContent === "Tab"
                  ? t("carousel.tab")
                  : tab.headingContent}
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
    tabletGap,
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const canNavigate = totalSlides > 1;

  return (
    <div ref={ref} {...rest} className={variants({ slidesToShow, gap })}>
      <div ref={sliderRef} className="relative">
        <Swiper
          key={swiperKey}
          modules={[Autoplay, Navigation]}
          spaceBetween={gap}
          slidesPerView={slidesToShow}
          autoplay={
            autoPlay && canNavigate
              ? {
                  delay: autoPlayDelay * 1000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                }
              : false
          }
          loop={totalSlides > slidesToShow}
          onBeforeInit={(swiper) => {
            const navigation = swiper.params.navigation;
            if (navigation && typeof navigation !== "boolean") {
              navigation.prevEl = sliderRef.current?.querySelector(
                ".promotion-arrow-prev",
              );
              navigation.nextEl = sliderRef.current?.querySelector(
                ".promotion-arrow-next",
              );
            }
          }}
          navigation={{}}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: gap / 2,
            },
            [TABLET_MIN_PX]: {
              slidesPerView: slidesToShow,
              spaceBetween: tabletGap,
            },
            [DESKTOP_MIN_PX]: {
              slidesPerView: slidesToShow,
              spaceBetween: gap,
            },
          }}
          className="w-full [&_.swiper-wrapper]:items-stretch [&_.promotion-grid-item]:w-full"
        >
          {childrenArray.map((child: ReactNode, index: number) => {
            // Swiper's unlayered CSS otherwise overrides Tailwind height/display.
            // Let each slide stretch to the tallest card instead of sizing alone.
            return (
              <SwiperSlide
                key={index}
                style={{ display: "flex", height: "auto" }}
              >
                {child}
              </SwiperSlide>
            );
          })}
          {showDots && canNavigate && (
            <Dots
              dotsColor={dotsColor}
              slidesCount={totalSlides}
              className={totalSlides <= slidesToShow ? "md:hidden" : undefined}
            />
          )}
        </Swiper>
        {showArrows && canNavigate && (
          <Arrows
            arrowsIcon={arrowsIcon}
            iconSize={iconSize}
            showArrowsOnHover={showArrowsOnHover}
            arrowsColor={arrowsColor}
            arrowsShape={arrowsShape}
          />
        )}
      </div>
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
      backgroundImage: sectionImageSource(
        getValue("backgroundImage", ""),
        IMAGES_PLACEHOLDERS.collection_1,
      ),
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
      buttonTextSize: getValue("buttonTextSize", 14),
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
    const { t } = useTranslation();
    const translateText = useTranslatedText();

    let {
      children,
      layout: legacyLayout = "slider",
      slidesToShow = 2,
      gap = 20,
      tabletGap = 16,
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
      sliderHeading: rawI18nSliderHeading = "EXPLORE MORE",
      sliderDescription:
        rawI18nSliderDescription = "Add a description for your promotions.",
      ...rest
    } = props;
    const layout = usePromotionGridLayout() ?? legacyLayout;
    const sliderDescription = translateText(
      rawI18nSliderDescription,
      "themeContent.sectionsPromotionGridGridItems.sliderDescription",
    );
    const sliderHeading = translateText(
      rawI18nSliderHeading,
      "themeContent.sectionsPromotionGridGridItems.sliderHeading",
    );

    let [swiperKey, setSwiperKey] = useState(0);
    let [activeTab, setActiveTab] = useState(0);
    const childInstances = useChildInstances();
    const [, setChildRevision] = useState(0);
    // Child inspector updates do not necessarily re-render their parent.
    // Tabs render child data here, so subscribe to the same item stores.
    useEffect(() => {
      if (layout !== "tabs") {
        return;
      }
      const unsubscribe = childInstances.map((instance) =>
        instance.subscribe(() => setChildRevision((revision) => revision + 1)),
      );
      return () => {
        for (const cleanup of unsubscribe) {
          cleanup();
        }
      };
    }, [layout, childInstances]);

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
      // Prefer it so Style 2 copy changes immediately in the preview.
      return { ...renderedProps, ...instanceData };
    });
    let tabsData =
      layout === "tabs"
        ? extractTabsData(tabSources.length ? tabSources : childrenArray).map(
            (tab) => ({
              ...tab,
              headingContent: translatePresetText(t, tab.headingContent),
              subheadingContent: translatePresetText(t, tab.subheadingContent),
              paragraphContent: translatePresetText(t, tab.paragraphContent),
              buttonContent: translatePresetText(t, tab.buttonContent),
            }),
          )
        : [];

    useEffect(() => {
      setSwiperKey((prev) => {
        return prev + 1;
      });
    }, []);

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
        <div className="mx-auto mb-8 flex max-w-165 flex-col items-center gap-6 px-5 text-center md:px-0">
          <h2 className="font-heading text-(length:--h4-base-size) leading-[1.1] tracking-[-0.02em] md:text-(length:--h2-base-size) md:tracking-[-0.03em] lg:text-(length:--h3-base-size)">
            {sliderHeading}
          </h2>
          <Paragraph
            content={sliderDescription}
            alignment="center"
            width="full"
            className="font-body text-sm leading-[1.6] tracking-[0.01em]"
          />
        </div>
        <SliderLayout
          childrenArray={childrenArray}
          totalSlides={totalSlides}
          slidesToShow={slidesToShow}
          gap={gap}
          tabletGap={tabletGap}
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
  limit: 1,
  settings: [
    {
      group: "Style 2 settings",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout type",
          configs: {
            options: [
              { value: "slider", label: "Style 1" },
              { value: "tabs", label: "Style 2" },
            ],
          },
          defaultValue: "slider",
          // Retain saved child layouts, but expose the selector only on parent.
          condition: () => false,
        },
        {
          type: "range",
          name: "tabsHeight",
          label: "Style 2 height (desktop)",
          configs: {
            min: 400,
            max: 1000,
            step: 50,
            unit: "px",
          },
          defaultValue: 840,
          helpText:
            "Minimum desktop height. The section grows if its content needs more space.",
        },
        {
          type: "range",
          name: "mobileTabsHeight",
          label: "Style 2 height (mobile)",
          configs: {
            min: 480,
            max: 800,
            step: 2,
            unit: "px",
          },
          defaultValue: 562,
          helpText:
            "Minimum mobile height. Longer text expands the section so the tabs never overlap the content.",
        },
      ],
    },
    {
      group: "Style 1 heading",
      inputs: [
        {
          type: "text",
          name: "sliderHeading",
          label: "Heading",
          defaultValue: "EXPLORE MORE",
        },
        {
          type: "richtext",
          name: "sliderDescription",
          label: "Description",
          defaultValue: "Add a description for your promotions.",
        },
      ],
    },
    {
      group: "Style 1 settings",
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
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap (desktop; mobile uses half)",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
        },
        {
          type: "range",
          name: "tabletGap",
          label: "Items gap (tablet)",
          configs: { min: 0, max: 60, step: 4, unit: "px" },
          defaultValue: 16,
        },
        {
          type: "switch",
          name: "autoPlay",
          label: "Auto play",
          defaultValue: false,
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
      group: "Style 1 navigation",
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
    tabletGap: 16,
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
    sliderDescription: "Add a description for your promotions.",
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
        headingContent: "Promotion heading",
        size: "default",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent: "Add a description for this promotion.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "#",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Promotion 1",
        tabParagraphContent: "Add a description for this promotion.",
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
        headingContent: "Promotion heading",
        size: "default",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent: "Add a description for this promotion.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "#",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Promotion 2",
        tabParagraphContent: "Add a description for this promotion.",
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
        headingContent: "Promotion heading",
        size: "default",
        minSize: 28,
        maxSize: 44,
        color: "#FEF4EB",
        alignment: "center",
        weight: "400",
        paragraphContent: "Add a description for this promotion.",
        paragraphColor: "#FEF4EB",
        paragraphAlignment: "center",
        paragraphWidth: "full",
        buttonContent: "EXPLORE NOW",
        to: "#",
        variant: "decor",
        textColorDecor: "#FEF4EB",
        tabLabel: "Promotion 3",
        tabParagraphContent: "Add a description for this promotion.",
        tabButtonContent: "EXPLORE NOW",
        tabOverlayColor: "#1A1A1A",
        tabOverlayOpacity: 60,
      },
    ],
  },
});
