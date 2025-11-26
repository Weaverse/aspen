import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, useEffect, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import "swiper/css";
import "swiper/css/effect-fade";

type TestimonialProps = SectionProps;

const TestimonialIndex = forwardRef<HTMLElement, TestimonialProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);

    useEffect(() => {
      setIsSwiperInitialized(false);
    }, [children]);

    useEffect(() => {
      if (!isSwiperInitialized) {
        const fallbackTimer = setTimeout(() => {
          setIsSwiperInitialized(true);
        }, 500);
        return () => clearTimeout(fallbackTimer);
      }
    }, [isSwiperInitialized]);

    useEffect(() => {
      // Event handler functions
      const handlePrevSlide = (event: Event) => {
        let swiperInstance = (event as CustomEvent).detail?.swiper;
        if (!swiperInstance && window.testimonialSwiper) {
          swiperInstance = window.testimonialSwiper;
        }
        if (swiperInstance) {
          swiperInstance.slidePrev();
        }
      };

      const handleNextSlide = (event: Event) => {
        let swiperInstance = (event as CustomEvent).detail?.swiper;
        if (!swiperInstance && window.testimonialSwiper) {
          swiperInstance = window.testimonialSwiper;
        }
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      };

      // Add event listeners
      document.addEventListener("testimonial-prev-slide", handlePrevSlide);
      document.addEventListener("testimonial-next-slide", handleNextSlide);

      // Clean up
      return () => {
        document.removeEventListener("testimonial-prev-slide", handlePrevSlide);
        document.removeEventListener("testimonial-next-slide", handleNextSlide);
      };
    }, []);

    return (
      <Section ref={ref} {...rest} containerClassName="overflow-hidden">
        <Swiper
          loop={true}
          slidesPerView={1}
          spaceBetween={0}
          effect="fade"
          fadeEffect={{
            crossFade: true,
          }}
          modules={[EffectFade]}
          speed={500}
          allowTouchMove={true}
          className={`testimonial-swiper h-full w-full transition-opacity duration-300 ${
            isSwiperInitialized ? "opacity-100" : "opacity-0"
          }`}
          onSwiper={(swiperInstance) => {
            window.testimonialSwiper = swiperInstance;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsSwiperInitialized(true);
              });
            });
          }}
        >
          {Array.isArray(children)
            ? children?.map((child: any, index: number) => (
                <SwiperSlide key={index} className="h-full w-full">
                  {child}
                </SwiperSlide>
              ))
            : children}
        </Swiper>
      </Section>
    );
  },
);

declare global {
  interface Window {
    testimonialSwiper?: SwiperType;
  }
}

export default TestimonialIndex;

export const schema = createSchema({
  type: "testimonial",
  title: "Testimonial",
  inspector: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
  ],
  childTypes: ["testimonial--item"],
  presets: {
    children: [{ type: "testimonial--item" }, { type: "testimonial--item" }],
  },
});
