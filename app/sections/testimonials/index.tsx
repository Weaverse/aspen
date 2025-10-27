import { createSchema } from "@weaverse/hydrogen";
import { forwardRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

type TestimonialProps = SectionProps;

const TestimonialIndex = forwardRef<HTMLElement, TestimonialProps>(
  (props, ref) => {
    const { children, ...rest } = props;
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
          className="mySwiper h-full w-full"
          effect={"slide"}
          onSwiper={(swiperInstance) => {
            // Store the Swiper instance in a global variable for easy access
            window.testimonialSwiper = swiperInstance;
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
