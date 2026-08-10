import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type { CSSProperties } from "react";
import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { Image } from "~/components/image";
import type { OverlayProps } from "~/components/overlay";
import { Overlay, overlayInputs } from "~/components/overlay";
import { useAnimation } from "~/hooks/use-animation";
import { useClientReady } from "~/utils/react-player";

const SECTION_HEIGHTS = {
  small: {
    desktop: "40vh",
    mobile: "50vh",
  },
  medium: {
    desktop: "50vh",
    mobile: "60vh",
  },
  large: {
    desktop: "70vh",
    mobile: "80vh",
  },
  aspen: null,
  custom: null,
} as const;

const VIDEO_ASPECT_RATIOS = {
  "16/9": 16 / 9,
  "1/1": 1,
  "4/3": 4 / 3,
  "9/16": 9 / 16,
} as const;

type SectionHeight = keyof typeof SECTION_HEIGHTS;
type VideoAspectRatio = keyof typeof VIDEO_ASPECT_RATIOS;
type ContentLayout = "aspen" | "stacked";

interface HeroVideoData extends OverlayProps, VariantProps<typeof gapVariants> {
  videoURL?: string;
  videoAspectRatio?: VideoAspectRatio;
  posterImage?: string | WeaverseImage;
  mobilePosterImage?: string | WeaverseImage;
  height: SectionHeight;
  heightOnDesktop: number;
  heightOnMobile: number;
  contentLayout?: ContentLayout;
}

export interface HeroVideoProps extends HeroVideoData, HydrogenComponentProps {}

const gapVariants = cva(
  "absolute inset-0 z-20 mx-auto flex max-w-screen flex-col items-center justify-center px-5",
  {
    variants: {
      gap: {
        0: "",
        4: "gap-1",
        8: "gap-2",
        12: "gap-3",
        16: "gap-4",
        20: "gap-5",
        24: "gap-3 md:gap-6",
        28: "gap-3.5 md:gap-7",
        32: "gap-4 md:gap-8",
        36: "gap-4 md:gap-9",
        40: "gap-5 md:gap-10",
        44: "gap-5 md:gap-11",
        48: "gap-6 md:gap-12",
        52: "gap-6 md:gap-[52px]",
        56: "gap-7 md:gap-14",
        60: "gap-7 md:gap-[60px]",
      },
    },
    defaultVariants: {
      gap: 20,
    },
  },
);

const ASPEN_CONTENT_CLASSES = [
  "absolute inset-0 z-20 mx-auto w-full max-w-screen px-5 text-center",
  "[&_.subheading]:absolute [&_.subheading]:top-[10.5%] [&_.subheading]:right-0 [&_.subheading]:left-0 [&_.subheading]:mx-auto [&_.subheading]:max-w-[300px] [&_.subheading]:font-body [&_.subheading]:text-[32px] [&_.subheading]:leading-[32px] [&_.subheading]:font-normal [&_.subheading]:tracking-normal [&_.subheading]:opacity-50 [&_.subheading]:[text-wrap:wrap]",
  "md:[&_.subheading]:top-[6.5%] md:[&_.subheading]:max-w-[1120px] md:[&_.subheading]:text-[72px] md:[&_.subheading]:leading-[96px]",
  "[&_.heading]:absolute [&_.heading]:top-[13.76%] [&_.heading]:right-0 [&_.heading]:left-0 [&_.heading]:mx-auto [&_.heading]:max-w-[290px] [&_.heading]:font-body [&_.heading]:text-[42px] [&_.heading]:leading-[41px] [&_.heading]:tracking-normal [&_.heading]:[text-wrap:wrap]",
  "md:[&_.heading]:top-[33.36%] md:[&_.heading]:max-w-[570px] md:[&_.heading]:text-[48px] md:[&_.heading]:leading-[48px]",
  "[&_.paragraph]:absolute [&_.paragraph]:top-[64.96%] [&_.paragraph]:right-0 [&_.paragraph]:left-0 [&_.paragraph]:mx-auto [&_.paragraph]:max-w-[276px] [&_.paragraph]:text-[14px] [&_.paragraph]:leading-[21px]",
  "md:[&_.paragraph]:top-[55.84%] md:[&_.paragraph]:max-w-[472px]",
  "[&_.button]:absolute [&_.button]:top-[83.54%] [&_.button]:right-0 [&_.button]:left-0 [&_.button]:mx-auto [&_.button]:w-fit [&_.button]:font-semibold [&_.button]:text-[14px]",
  "md:[&_.button]:top-[65.2%]",
].join(" ");

interface PlayerSize {
  width: number | string;
  height: number | string;
}

function getPlayerSize(
  section: HTMLElement | null,
  aspectRatio: VideoAspectRatio,
): PlayerSize {
  if (!section) {
    return { width: "100%", height: "100%" };
  }

  const rect = section.getBoundingClientRect();
  if (!(rect.width && rect.height)) {
    return { width: "100%", height: "100%" };
  }

  const sourceRatio = VIDEO_ASPECT_RATIOS[aspectRatio];
  const widthScale = rect.width;
  const heightScale = rect.height * sourceRatio;
  const width = Math.max(widthScale, heightScale);

  return {
    width: Math.ceil(width),
    height: Math.ceil(width / sourceRatio),
  };
}

function getImageData(image?: string | WeaverseImage) {
  if (!image) {
    return undefined;
  }
  return typeof image === "string"
    ? { url: image, altText: "Hero video poster" }
    : image;
}

// react-player v3 is ESM-only and lazy-loads individual players internally.
const ReactPlayer = lazy(() => import("react-player"));

const HeroVideo = forwardRef<HTMLElement, HeroVideoProps>((props, ref) => {
  const {
    videoURL,
    videoAspectRatio = "16/9",
    posterImage,
    mobilePosterImage,
    gap,
    height,
    heightOnDesktop,
    heightOnMobile,
    contentLayout = "stacked",
    enableOverlay,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    children,
    ...rest
  } = props;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState<PlayerSize>({
    width: "100%",
    height: "100%",
  });
  const isAspenLayout = height === "aspen";
  const desktopHeight =
    SECTION_HEIGHTS[height]?.desktop || `${heightOnDesktop}px`;
  const mobileHeight = SECTION_HEIGHTS[height]?.mobile || `${heightOnMobile}px`;
  const sectionStyle = {
    "--desktop-height": desktopHeight,
    "--mobile-height": mobileHeight,
  } as CSSProperties;

  const { ref: inViewRef, inView } = useInView({ triggerOnce: true });
  const clientReady = useClientReady();

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node;
      inViewRef(node);
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        Object.assign(ref, { current: node });
      }
    },
    [inViewRef, ref],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const handleResize = () => {
      setSize(getPlayerSize(section, videoAspectRatio));
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(section);
    return () => resizeObserver.disconnect();
  }, [videoAspectRatio]);

  const [scope] = useAnimation();
  const desktopPoster = getImageData(posterImage);
  const mobilePoster = getImageData(mobilePosterImage);

  return (
    <section
      ref={setRefs}
      {...rest}
      className={clsx(
        "relative isolate w-full overflow-hidden bg-(--color-background-subtle)",
        isAspenLayout
          ? "aspect-[375/469.125] md:aspect-[2/1]"
          : "h-(--mobile-height) md:h-(--desktop-height)",
      )}
      style={sectionStyle}
    >
      {desktopPoster && (
        <Image
          data={desktopPoster}
          sizes="100vw"
          className={clsx(
            "absolute inset-0 z-0",
            mobilePoster && "hidden md:block",
          )}
        />
      )}
      {mobilePoster && (
        <Image
          data={mobilePoster}
          sizes="100vw"
          className="absolute inset-0 z-0 md:hidden"
        />
      )}

      {clientReady && inView && videoURL && (
        <div
          className="absolute top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2"
          style={size}
        >
          <Suspense fallback={null}>
            <ReactPlayer
              src={videoURL}
              playing
              muted
              loop
              playsinline
              width="100%"
              height="100%"
              controls={false}
              className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />
          </Suspense>
        </div>
      )}

      <Overlay
        enableOverlay={enableOverlay}
        overlayColor={overlayColor}
        overlayColorHover={overlayColorHover}
        overlayOpacity={overlayOpacity}
        className="z-10"
      />

      <div
        ref={scope}
        className={
          contentLayout === "aspen"
            ? ASPEN_CONTENT_CLASSES
            : gapVariants({ gap })
        }
      >
        {children}
      </div>
    </section>
  );
});

export default HeroVideo;

export const schema = createSchema({
  type: "hero-video",
  title: "Hero video",
  settings: [
    {
      group: "Video",
      inputs: [
        {
          type: "text",
          name: "videoURL",
          label: "Video URL",
          defaultValue: "https://www.youtube.com/watch?v=gbLmku5QACM",
          placeholder: "https://www.youtube.com/watch?v=gbLmku5QACM",
          helpText: "Supports YouTube, Vimeo, MP4, WebM, and HLS streams.",
        },
        {
          type: "select",
          name: "videoAspectRatio",
          label: "Source video aspect ratio",
          defaultValue: "16/9",
          configs: {
            options: [
              { value: "16/9", label: "Landscape (16:9)" },
              { value: "1/1", label: "Square (1:1)" },
              { value: "4/3", label: "Landscape (4:3)" },
              { value: "9/16", label: "Portrait (9:16)" },
            ],
          },
          helpText:
            "Choose the uploaded video's real ratio so it can crop like a cover image without distortion.",
        },
        {
          type: "image",
          name: "posterImage",
          label: "Poster image",
          helpText:
            "Shown while the video loads and used as its visual fallback.",
        },
        {
          type: "image",
          name: "mobilePosterImage",
          label: "Mobile poster image",
          helpText: "Optional. Leave blank to reuse the desktop poster.",
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "aspen", label: "Aspen design (2:1 / 4:5)" },
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "custom", label: "Custom" },
            ],
          },
          defaultValue: "aspen",
        },
        {
          type: "range",
          name: "heightOnDesktop",
          label: "Height on desktop",
          defaultValue: 650,
          configs: {
            min: 400,
            max: 1000,
            step: 10,
            unit: "px",
          },
          condition: (data: HeroVideoData) => data.height === "custom",
        },
        {
          type: "range",
          name: "heightOnMobile",
          label: "Height on mobile",
          defaultValue: 470,
          configs: {
            min: 250,
            max: 700,
            step: 10,
            unit: "px",
          },
          condition: (data: HeroVideoData) => data.height === "custom",
        },
        {
          type: "select",
          name: "contentLayout",
          label: "Content layout",
          defaultValue: "aspen",
          configs: {
            options: [
              { value: "aspen", label: "Aspen design" },
              { value: "stacked", label: "Centered stack" },
            ],
          },
          helpText:
            "Aspen design follows the approved desktop/mobile positions. Centered stack uses an adjustable gap.",
        },
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
          condition: (data: HeroVideoData) => data.contentLayout === "stacked",
        },
      ],
    },
    {
      group: "Overlay",
      inputs: overlayInputs,
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    enableOverlay: true,
    overlayColor: "#000000",
    overlayOpacity: 20,
    videoURL: "https://www.youtube.com/watch?v=gbLmku5QACM",
    videoAspectRatio: "1/1",
    posterImage: IMAGES_PLACEHOLDERS.banner_1,
    height: "aspen",
    contentLayout: "aspen",
    gap: 20,
    children: [
      {
        type: "subheading",
        content: "A laidback, sophisticated lounge piece",
        as: "p",
        color: "#FEF4EB",
        size: "base",
        weight: "normal",
        alignment: "center",
      },
      {
        type: "heading",
        content: "CLOUD-LIKE SOFAS THAT SUPPORT RELAXING ANY TIME",
        as: "h2",
        color: "#FEF4EB",
        size: "custom",
        mobileSize: "5xl",
        desktopSize: "5xl",
        weight: "400",
        letterSpacing: "normal",
        alignment: "center",
      },
      {
        type: "paragraph",
        content:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        color: "#FEF4EB",
        textSize: "sm",
        width: "full",
        alignment: "center",
      },
      {
        type: "button",
        text: "EXPLORE NOW",
        to: "/collections/all",
        variant: "decor",
        textColorDecor: "#FEF4EB",
      },
    ],
  },
});
