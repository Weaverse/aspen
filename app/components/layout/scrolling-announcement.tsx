import {
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { type CSSProperties, useEffect, useRef } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { cn } from "~/utils/cn";
import { CountrySelector } from "./country-selector";

const announcementWidthVariants = cva("relative h-full w-full", {
  variants: {
    width: {
      full: "",
      stretch: "px-5 md:px-8 xl:px-12",
      fixed: "mx-auto max-w-[1360px]",
    },
  },
  defaultVariants: {
    width: "fixed",
  },
});

function splitHtmlByLineBreaks(html: string): string[] {
  return html
    .split(/<br\s*\/?>|<\/p>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

function AnnouncementArrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-5", direction === "left" && "rotate-180")}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M14.0575 4.74121L13.1737 5.62508L16.9236 9.37496H0.625V10.625H16.9234L13.1737 14.3748L14.0575 15.2586L19.3163 9.99992L14.0575 4.74121Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    announcementWidth,
    designSystemPreset,
    socialFacebookAnnouncement,
    socialInstagramAnnouncement,
    socialXAnnouncement,
    socialYoutubeAnnouncement,
    topbarHeight,
    topbarText,
  } = themeSettings;

  const barRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperClass | null>(null);
  const slides = splitHtmlByLineBreaks(topbarText || "");
  const isVisible = Boolean(topbarText && slides.length > 0);
  const desktopHeight =
    designSystemPreset === "custom" ? (topbarHeight ?? 56) : 56;

  const socialItems = [
    {
      name: "Facebook",
      to: socialFacebookAnnouncement,
      Icon: FacebookLogo,
    },
    { name: "X", to: socialXAnnouncement, Icon: TwitterLogo },
    {
      name: "Instagram",
      to: socialInstagramAnnouncement,
      Icon: InstagramLogo,
    },
    {
      name: "YouTube",
      to: socialYoutubeAnnouncement,
      Icon: YoutubeLogo,
    },
  ];

  useEffect(() => {
    const element = barRef.current;

    if (!isVisible || !element) {
      document.body.style.setProperty("--topbar-height", "0px");
      return;
    }

    const updateHeight = () => {
      document.body.style.setProperty(
        "--topbar-height",
        `${Math.max(element.offsetHeight - window.scrollY, 0)}px`,
      );
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("scroll", updateHeight, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeight);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="announcement-bar"
      ref={barRef}
      className="z-10 h-11 w-full overflow-hidden bg-(--color-topbar-bg) text-(--color-topbar-text) xl:h-(--announcement-height)"
      style={
        {
          "--announcement-height": `${desktopHeight}px`,
        } as CSSProperties
      }
    >
      <div className={announcementWidthVariants({ width: announcementWidth })}>
        <div className="absolute inset-y-0 left-0 hidden items-center gap-3.5 xl:flex">
          {socialItems.map(({ name, to, Icon }) =>
            to ? (
              <a
                key={name}
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="transition-opacity hover:opacity-70"
              >
                <Icon aria-hidden="true" className="size-4" />
              </a>
            ) : null,
          )}
        </div>

        <div className="relative h-full w-full xl:absolute xl:left-1/2 xl:w-[600px] xl:-translate-x-1/2">
          <Swiper
            allowTouchMove={slides.length > 1}
            className="h-full w-full [&_.swiper-slide]:h-full [&_.swiper-wrapper]:h-full"
            loop={slides.length > 1}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            slidesPerView={1}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={`${index}-${slide.slice(0, 24)}`}>
                <div
                  className="flex h-full items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap px-12 text-center text-xs uppercase leading-[18px] opacity-80 [&_p]:m-0 [&_p]:inline xl:px-14 xl:text-sm xl:leading-5"
                  dangerouslySetInnerHTML={{ __html: slide }}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            className="absolute top-1/2 left-5 z-10 -translate-y-1/2 opacity-80 transition-opacity hover:opacity-100 md:left-8 xl:left-0"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous announcement"
          >
            <AnnouncementArrow direction="left" />
          </button>

          <button
            type="button"
            className="absolute top-1/2 right-5 z-10 -translate-y-1/2 opacity-80 transition-opacity hover:opacity-100 md:right-8 xl:right-0"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next announcement"
          >
            <AnnouncementArrow direction="right" />
          </button>
        </div>

        <div className="absolute inset-y-0 right-0 hidden items-center gap-1.5 text-sm xl:flex">
          <CountrySelector
            enableFlag={false}
            inputClassName="h-8 rounded-lg border-[#9D9D9D] px-4"
            wrapperClassName="w-[191px]"
          />
          <CountrySelector
            enableFlag={false}
            inputClassName="h-8 rounded-lg border-[#9D9D9D] px-4"
            mode="language"
            wrapperClassName="w-[104px]"
          />
        </div>
      </div>
    </div>
  );
}
