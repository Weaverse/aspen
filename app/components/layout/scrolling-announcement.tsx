import { ArrowLeft, ArrowRight, FacebookLogo, InstagramLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { cn } from "~/utils/cn";
import { CountrySelector } from "./country-selector";
import { Navigation } from "swiper/modules";
import { Link } from "react-router";

let variants = cva("", {
  variants: {
    width: {
      full: "w-full h-full",
      stretch: "w-full h-full",
      fixed: "w-full h-full max-w-(--page-width) mx-auto",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "px-3 md:px-4 lg:px-6 mx-auto",
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
  let themeSettings = useThemeSettings();
  let {
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
      icon: <InstagramLogo className="w-5 h-5" />,
    },
    {
      name: "X",
      to: socialXAnnouncement,
      icon: <XLogo className="w-5 h-5" />,
    },
    {
      name: "LinkedIn",
      to: socialLinkedInAnnouncement,
      icon: <LinkedinLogo className="w-5 h-5" />,
    },
    {
      name: "Facebook",
      to: socialFacebookAnnouncement,
      icon: <FacebookLogo className="w-5 h-5" />,
    },
  ];

  function updateHeight() {
    const height = ref.current.offsetHeight;
    if (topbarText) {
      document.body.style.setProperty(
        "--topbar-height",
        `${Math.max(height - window.scrollY, 0)}px`
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
      className="w-full flex justify-center items-center overflow-visible lg:px-0 md:px-4 px-3 z-10"
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
          "grid lg:grid-cols-3 lg:gap-8 justify-center items-center py-1 grid-cols-1",
          variants({ width: announcementWidth })
        )}
      >
        <div className="lg:flex gap-4 justify-start hidden">
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
            ) : null
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
                  className="text-center px-12 py-1 overflow-hidden text-ellipsis whitespace-nowrap [&_p]:inline [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: slide }}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            className="announcement-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2"
            style={{backgroundColor: topbarBgColor,} as React.CSSProperties}
            aria-label="Previous slide"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            className="announcement-next absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2"
            style={{backgroundColor: topbarBgColor,} as React.CSSProperties}
            aria-label="Next slide"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="lg:flex justify-end hidden">
          <CountrySelector inputClassName="px-4 py-2" />
        </div>
      </div>
    </div>
  );
}
