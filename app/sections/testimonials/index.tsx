import { createSchema } from "@weaverse/hydrogen";
import { Children, forwardRef, useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import "swiper/css";
import "swiper/css/effect-fade";
import {
  type TestimonialArrowIcon,
  type TestimonialArrowShape,
  TestimonialNavigationContext,
} from "./context";

interface TestimonialProps extends SectionProps {
  loopNavigation?: boolean;
  navigationButtonColor?: string;
  navigationButtonHoverColor?: string;
  navigationIconColor?: string;
  navigationIcon?: TestimonialArrowIcon;
  navigationShape?: TestimonialArrowShape;
}

const TestimonialIndex = forwardRef<HTMLElement, TestimonialProps>(
  (props, ref) => {
    const {
      children,
      loopNavigation = true,
      navigationButtonColor = "#EDEAE6",
      navigationButtonHoverColor = "#E4DFDA",
      navigationIconColor = "#343231",
      navigationIcon = "caret",
      navigationShape = "rounded",
      ...rest
    } = props;
    const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef<SwiperType | null>(null);
    const slides = Children.toArray(children);
    const canNavigate = slides.length > 1;
    const canGoPrevious = canNavigate && (loopNavigation || activeIndex > 0);
    const canGoNext =
      canNavigate && (loopNavigation || activeIndex < slides.length - 1);

    useEffect(() => {
      if (!isSwiperInitialized) {
        const fallbackTimer = setTimeout(() => {
          setIsSwiperInitialized(true);
        }, 500);
        return () => clearTimeout(fallbackTimer);
      }
    }, [isSwiperInitialized]);

    return (
      <Section
        ref={ref}
        {...rest}
        width="full"
        verticalPadding="none"
        className="bg-[#F6F4F3]"
        containerClassName="overflow-hidden"
      >
        <TestimonialNavigationContext.Provider
          value={{
            canNavigate,
            canGoPrevious,
            canGoNext,
            goToPrevious: () => {
              if (canGoPrevious) {
                swiperRef.current?.slidePrev();
              }
            },
            goToNext: () => {
              if (canGoNext) {
                swiperRef.current?.slideNext();
              }
            },
            navigationButtonColor,
            navigationButtonHoverColor,
            navigationIconColor,
            navigationIcon,
            navigationShape,
          }}
        >
          <Swiper
            key={`${slides.length}-${loopNavigation}`}
            loop={false}
            rewind={canNavigate && loopNavigation}
            slidesPerView={1}
            spaceBetween={0}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            modules={[EffectFade]}
            speed={500}
            allowTouchMove={canNavigate}
            className={`testimonial-swiper h-full w-full transition-opacity duration-300 ${
              isSwiperInitialized ? "opacity-100" : "opacity-0"
            }`}
            onSwiper={(swiperInstance) => {
              swiperRef.current = swiperInstance;
              setActiveIndex(swiperInstance.activeIndex);
              requestAnimationFrame(() => setIsSwiperInitialized(true));
            }}
            onActiveIndexChange={(swiperInstance) => {
              setActiveIndex(swiperInstance.activeIndex);
            }}
          >
            {slides.map((child, index) => (
              <SwiperSlide key={index} className="h-full w-full">
                {child}
              </SwiperSlide>
            ))}
          </Swiper>
        </TestimonialNavigationContext.Provider>
      </Section>
    );
  },
);

export default TestimonialIndex;

export const schema = createSchema({
  type: "testimonial",
  title: "Testimonial",
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
    {
      group: "Navigation buttons",
      inputs: [
        {
          type: "switch",
          name: "loopNavigation",
          label: "Loop navigation",
          defaultValue: true,
          helpText:
            "Next wraps to the first testimonial and Previous wraps to the last.",
        },
        {
          type: "color",
          name: "navigationButtonColor",
          label: "Button color",
          defaultValue: "#EDEAE6",
        },
        {
          type: "color",
          name: "navigationButtonHoverColor",
          label: "Button hover color",
          defaultValue: "#E4DFDA",
        },
        {
          type: "color",
          name: "navigationIconColor",
          label: "Icon color",
          defaultValue: "#343231",
        },
        {
          type: "select",
          name: "navigationIcon",
          label: "Arrow icon",
          configs: {
            options: [
              { value: "caret", label: "Caret" },
              { value: "arrow", label: "Arrow" },
            ],
          },
          defaultValue: "caret",
        },
        {
          type: "toggle-group",
          name: "navigationShape",
          label: "Button shape",
          configs: {
            options: [
              { value: "rounded", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "rounded",
        },
      ],
    },
  ],
  childTypes: ["testimonial--item"],
  presets: {
    width: "full",
    verticalPadding: "none",
    backgroundColor: "#F6F4F3",
    backgroundFor: "section",
    navigationButtonColor: "#EDEAE6",
    navigationButtonHoverColor: "#E4DFDA",
    navigationIconColor: "#343231",
    navigationIcon: "caret",
    navigationShape: "rounded",
    loopNavigation: true,
    children: [{ type: "testimonial--item" }, { type: "testimonial--item" }],
  },
});
