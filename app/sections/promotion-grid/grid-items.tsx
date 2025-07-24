import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef, type ReactNode, useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { SectionProps } from "~/components/section";
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type GridItemProps = VariantProps<typeof variants> & SectionProps & {
  slidesToShow?: number;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  enableDots?: boolean;
  enableNavigation?: boolean;
};

let variants = cva("relative promotion-slider md:px-8 px-5", {
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

let PromotionSlider = forwardRef<HTMLDivElement, GridItemProps>((props, ref) => {
  let { 
    children, 
    slidesToShow = 2, 
    gap = 20, 
    autoPlay = false, 
    autoPlayDelay = 5000,
    enableDots = true,
    enableNavigation = true,
    ...rest 
  } = props;

  const [swiperKey, setSwiperKey] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const childrenArray = Array.isArray(children) ? children : children ? [children] : [];
  const totalSlides = childrenArray.length;

  useEffect(() => {
    setSwiperKey(prev => prev + 1);
  }, [slidesToShow, enableDots, enableNavigation, autoPlay, autoPlayDelay]);

  if (totalSlides === 0) {
    return <div ref={ref} {...rest} className={variants({ slidesToShow, gap })} />;
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

  return (
    <div ref={ref} {...rest} className={variants({ slidesToShow, gap })}>
      {/* Custom Swiper Styles */}
      <style dangerouslySetInnerHTML={{
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
        `
      }} />
      
      {enableNavigation && totalSlides > slidesToShow && (
        <>
          <button 
            ref={prevButtonRef}
            type="button" 
            onClick={handlePrevClick}
            className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <button 
            ref={nextButtonRef}
            type="button" 
            onClick={handleNextClick}
            className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightIcon className="w-6 h-6 text-gray-800" />
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
        navigation={enableNavigation ? {
          prevEl: prevButtonRef.current,
          nextEl: nextButtonRef.current,
        } : false}
        pagination={enableDots ? {
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
          el: '.swiper-pagination-custom',
        } : false}
        autoplay={autoPlay && totalSlides > slidesToShow ? {
          delay: autoPlayDelay * 1000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        } : false}
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
        {childrenArray.map((child, index) => (
          <SwiperSlide key={index}>
            {child as ReactNode}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Pagination Dots */}
      {enableDots && totalSlides > slidesToShow && (
        <div className="swiper-pagination-custom flex justify-center space-x-2 mt-6" />
      )}
    </div>
  );
});

export default PromotionSlider;

export let schema = createSchema({
  type: "grid-items",
  title: "Promotion slider",
  settings: [
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
        },
        {
          type: "switch",
          name: "enableNavigation",
          label: "Show navigation arrows",
          defaultValue: true,
        },
      ],
    },
  ],
  childTypes: ["promotion-grid-item"],
  presets: {
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
        children: [
          {
            type: "heading",
            content: "Announce your promotion",
          },
          {
            type: "paragraph",
            content:
              "Include the smaller details of your promotion in text below the title.",
          },
          {
            type: "promotion-item--buttons",
            children: [
              {
                type: "button",
                text: "Shop now",
              },
            ],
          },
        ],
      },
      {
        type: "promotion-grid-item",
        contentPosition: "bottom right",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_2,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        children: [
          {
            type: "heading",
            content: "Announce your promotion",
          },
          {
            type: "paragraph",
            content:
              "Include the smaller details of your promotion in text below the title.",
          },
          {
            type: "promotion-item--buttons",
            children: [
              {
                type: "button",
                text: "Shop promotion",
              },
            ],
          },
        ],
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center center",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
        enableOverlay: true,
        overlayColor: "#0c0c0c",
        overlayOpacity: 20,
        children: [
          {
            type: "heading",
            content: "New Collection",
          },
          {
            type: "paragraph",
            content: "Discover our latest products and exclusive offers.",
          },
          {
            type: "promotion-item--buttons",
            children: [
              {
                type: "button",
                text: "Explore Now",
              },
            ],
          },
        ],
      },
    ],
  },
});
