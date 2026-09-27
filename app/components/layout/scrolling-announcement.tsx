import {
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { type CSSProperties, useEffect, useRef } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { useTranslatedThemeSettings } from "~/hooks/use-translated-theme-settings";
import { cn } from "~/utils/cn";
import {
  CountrySelector,
  currencySelectorWrapperClassName,
  languageSelectorWrapperClassName,
  localeSelectorGroupClassName,
} from "./country-selector";

const announcementWidthVariants = cva("relative h-full w-full", {
  variants: {
    width: {
      full: "",
      stretch: "px-5 md:px-8 xl:px-12",
      fixed: "mx-auto max-w-[1360px] xl:px-10",
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
  const { t } = useTranslation();
  const themeSettings = useTranslatedThemeSettings();
  const {
    announcementWidth,
    headerWidth,
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
      className="z-10 min-h-11 w-full bg-(--color-topbar-bg) text-(--color-topbar-text) xl:min-h-(--announcement-height)"
      style={
        {
          "--announcement-height": `${desktopHeight}px`,
        } as CSSProperties
      }
    >
      <div
        className={cn(
          announcementWidthVariants({ width: announcementWidth }),
          // Align the selector group's right edge with the navigation actions.
          headerWidth === "fixed"
            ? "xl:mx-auto xl:w-[calc(100%-80px)] xl:max-w-[1360px] xl:px-0"
            : headerWidth === "stretch"
              ? "xl:mx-0 xl:w-full xl:max-w-none xl:px-10"
              : "xl:mx-0 xl:w-full xl:max-w-none xl:px-0",
          "xl:grid xl:min-h-(--announcement-height) xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)] xl:items-center xl:gap-6 xl:py-2",
        )}
      >
        <div className="hidden items-center gap-3 xl:flex">
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
                <Icon aria-hidden="true" className="size-[18px]" />
              </a>
            ) : null,
          )}
        </div>

        <div className="relative h-11 min-w-0 w-full xl:h-10">
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
            aria-label={t("announcement.previous")}
          >
            <AnnouncementArrow direction="left" />
          </button>

          <button
            type="button"
            className="absolute top-1/2 right-5 z-10 -translate-y-1/2 opacity-80 transition-opacity hover:opacity-100 md:right-8 xl:right-0"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label={t("announcement.next")}
          >
            <AnnouncementArrow direction="right" />
          </button>
        </div>

        <div
          className={cn(
            localeSelectorGroupClassName,
            "hidden justify-self-end text-sm xl:flex",
          )}
        >
          <CountrySelector
            enableFlag={false}
            inputClassName="min-h-8 rounded-lg border-[#9D9D9D] px-3 py-1 tracking-[0.02em]"
            wrapperClassName={currencySelectorWrapperClassName}
          />
          <CountrySelector
            enableFlag={false}
            inputClassName="min-h-8 rounded-lg border-[#9D9D9D] px-3 py-1 tracking-[0.02em]"
            mode="language"
            wrapperClassName={languageSelectorWrapperClassName}
          />
        </div>
      </div>
    </div>
  );
}
