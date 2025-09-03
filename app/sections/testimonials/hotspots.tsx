import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface HotspotsTestimonialProps extends HydrogenComponentProps {}

let HotspotsTestimonial = forwardRef<HTMLDivElement, HotspotsTestimonialProps>(
  (props, ref) => {
    let { children, ...rest } = props;

    // Handle custom events for testimonial navigation
    useEffect(() => {
      // Event handler functions
      const handlePrevSlide = (event: Event) => {
        const swiperInstance = (event as CustomEvent).detail?.swiper;
        if (swiperInstance) {
          swiperInstance.slidePrev();
        }
      };

      const handleNextSlide = (event: Event) => {
        const swiperInstance = (event as CustomEvent).detail?.swiper;
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
      <div ref={ref} {...rest} className="flex-1 overflow-hidden">
        <Swiper
          loop={true}
          slidesPerView={1}
          className="mySwiper h-full w-full"
          effect={"flip"}
          fadeEffect={{
            crossFade: true,
          }}
          modules={[EffectFade]}
          onSwiper={(swiperInstance) => {
            // Store the Swiper instance in a global variable for easy access
            window.testimonialSwiper = swiperInstance;
          }}
        >
          {children?.map((child, index) => (
            <SwiperSlide key={index} className="h-full w-full">
              {child}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  },
);

export default HotspotsTestimonial;

// Add global type for the window object to include our swiper instance
declare global {
  interface Window {
    testimonialSwiper?: SwiperType;
  }
}

export let schema: HydrogenComponentSchema = {
  type: "testimonial--hotspots",
  title: "Hotspots",
  childTypes: ["testimonial--hotspots-item"],
  inspector: [
    {
      group: "Layout",
      inputs: [],
    },
  ],
  presets: {
    children: [
      {
        type: "testimonial--hotspots-item",
      },
      { type: "testimonial--hotspots-item" },
    ],
  },
};
