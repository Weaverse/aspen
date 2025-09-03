import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { cn } from "~/utils/cn";
import { CountrySelector } from "./country-selector";

let variants = cva("", {
  variants: {
    width: {
      full: "h-full w-full",
      stretch: "h-full w-full",
      fixed: "mx-auto h-full w-full max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-3 md:px-4 lg:px-6",
    },
  },
});

const MAX_DURATION = 20;

function splitHtmlByLineBreaks(html: string): string[] {
  return html
    .split(/<br\s*\/?>|<\/p>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    topbarText,
    topbarHeight,
    topbarTextColor,
    topbarBgColor,
    topbarScrollingGap,
    topbarScrollingSpeed,
    socialInstagramAnnouncement,
    socialXAnnouncement,
    socialLinkedInAnnouncement,
    socialFacebookAnnouncement,
    announcementWidth,
  } = themeSettings;

  const ref = useRef<HTMLDivElement>(null);
  const slides = splitHtmlByLineBreaks(topbarText || "");

  let socialItems = [
    {
      name: "Instagram",
      to: socialInstagramAnnouncement,
      icon: <InstagramLogo className="h-5 w-5" />,
    },
    {
      name: "X",
      to: socialXAnnouncement,
      icon: <XLogo className="h-5 w-5" />,
    },
    {
      name: "LinkedIn",
      to: socialLinkedInAnnouncement,
      icon: <LinkedinLogo className="h-5 w-5" />,
    },
    {
      name: "Facebook",
      to: socialFacebookAnnouncement,
      icon: <FacebookLogo className="h-5 w-5" />,
    },
  ];

  function updateHeight() {
    const height = ref.current.offsetHeight;
    if (topbarText) {
      document.body.style.setProperty(
        "--topbar-height",
        `${Math.max(height - window.scrollY, 0)}px`,
      );
    } else {
      document.body.style.setProperty("--topbar-height", "0px");
    }
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateHeight();

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(el);

    window.addEventListener("scroll", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeight);
    };
  }, [topbarText]);

  if (!topbarText || slides.length === 0) return null;

  return (
    <div
      id="announcement-bar"
      ref={ref}
      className="z-10 flex w-full items-center justify-center overflow-visible px-5 md:px-6 lg:px-6"
      style={
        {
          minHeight: `${topbarHeight}px`,
          backgroundColor: topbarBgColor,
          color: topbarTextColor,
          "--marquee-duration": `${MAX_DURATION / topbarScrollingSpeed}s`,
          "--gap": `${topbarScrollingGap}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "grid grid-cols-1 items-center justify-center py-1 md:grid-cols-3 md:gap-8",
          variants({ width: announcementWidth }),
        )}
      >
        <div className="hidden justify-start gap-4 md:flex">
          {socialItems.map((social) =>
            social.to ? (
              <Link
                key={social.name}
                to={social.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg"
              >
                {social.icon}
              </Link>
            ) : null,
          )}
        </div>
        <div className="relative w-full">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: ".announcement-prev",
              nextEl: ".announcement-next",
            }}
            slidesPerView={1}
            loop
            autoHeight
            className="w-full"
          >
            {slides.map((slide, idx) => (
              <SwiperSlide key={idx}>
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap px-12 py-1 text-center [&_p]:m-0 [&_p]:inline"
                  dangerouslySetInnerHTML={{ __html: slide }}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            className="announcement-prev -translate-y-1/2 absolute top-1/2 left-0 z-10 p-2"
            style={{ backgroundColor: topbarBgColor } as React.CSSProperties}
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="rotate-180"
            >
              <path
                d="M14.0575 4.74121L13.1737 5.62508L16.9236 9.37496H0.625V10.625H16.9234L13.1737 14.3748L14.0575 15.2586L19.3163 9.99992L14.0575 4.74121Z"
                fill="#29231E"
              />
            </svg>
          </button>

          <button
            type="button"
            className="announcement-next -translate-y-1/2 absolute top-1/2 right-0 z-10 p-2"
            style={{ backgroundColor: topbarBgColor } as React.CSSProperties}
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M14.0575 4.74121L13.1737 5.62508L16.9236 9.37496H0.625V10.625H16.9234L13.1737 14.3748L14.0575 15.2586L19.3163 9.99992L14.0575 4.74121Z"
                fill="#29231E"
              />
            </svg>
          </button>
        </div>
        <div className="hidden justify-end md:flex">
          <CountrySelector inputClassName="px-4 py-1" enableFlag={false} />
        </div>
      </div>
    </div>
  );
}
