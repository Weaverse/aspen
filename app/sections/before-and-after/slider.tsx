import { Image } from "@shopify/hydrogen";
import {
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

type HeightMode = "aspen" | "custom";

interface BeforeAndAfterProps extends HydrogenComponentProps {
  beforeImage1?: WeaverseImage | string;
  afterImage2?: WeaverseImage | string;
  separatorColor?: string;
  showList?: boolean;
  listColor?: string;
  separatorWidth?: number;
  heightMode?: HeightMode;
  sliderHeightDesktop?: number;
  sliderHeightMobile?: number;
  initialPositionDesktop?: number;
  initialPositionMobile?: number;
}

const clampPosition = (position: number) =>
  Math.min(100, Math.max(0, position));

function getImageData(
  image: WeaverseImage | string | undefined,
  altText: string,
) {
  if (!image) {
    return undefined;
  }
  return typeof image === "string" ? { url: image, altText } : image;
}

const BeforeAndAfter = forwardRef<HTMLDivElement, BeforeAndAfterProps>(
  (props, ref) => {
    const {
      beforeImage1,
      afterImage2,
      separatorColor = "#FFFFFF",
      showList = true,
      listColor = "#524B46",
      separatorWidth = 8,
      heightMode = "aspen",
      sliderHeightDesktop = 600,
      sliderHeightMobile = 200,
      initialPositionDesktop = 51,
      initialPositionMobile = 44,
      ...rest
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const dragCleanupRef = useRef<(() => void) | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const beforeImage = getImageData(beforeImage1, "Before");
    const afterImage = getImageData(afterImage2, "After");

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          Object.assign(ref, { current: node });
        }
      },
      [ref],
    );

    useEffect(() => {
      const mediaQuery = window.matchMedia("(min-width: 768px)");
      const syncPosition = (isDesktop: boolean) => {
        setPosition(
          clampPosition(
            isDesktop ? initialPositionDesktop : initialPositionMobile,
          ),
        );
      };
      const handleChange = (event: MediaQueryListEvent) => {
        syncPosition(event.matches);
      };

      syncPosition(mediaQuery.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [initialPositionDesktop, initialPositionMobile]);

    useEffect(
      () => () => {
        dragCleanupRef.current?.();
      },
      [],
    );

    const updatePosition = useCallback((clientX: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      setPosition(clampPosition(((clientX - rect.left) / rect.width) * 100));
    }, []);

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragCleanupRef.current?.();
        updatePosition(event.clientX);
        document.body.style.cursor = "ew-resize";

        const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
          updatePosition(moveEvent.clientX);
        };
        const cleanup = () => {
          document.body.style.removeProperty("cursor");
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", cleanup);
          document.removeEventListener("pointercancel", cleanup);
          dragCleanupRef.current = null;
        };

        dragCleanupRef.current = cleanup;
        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", cleanup);
        document.addEventListener("pointercancel", cleanup);
      },
      [updatePosition],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          setPosition(event.key === "Home" ? 0 : 100);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          setPosition((current) =>
            clampPosition((current ?? initialPositionMobile) + direction),
          );
        }
      },
      [initialPositionMobile],
    );

    const sliderStyle = {
      "--separator-color": separatorColor,
      "--list-color": listColor,
      "--separator-width": `${separatorWidth}px`,
      "--slider-height-desktop": `${sliderHeightDesktop}px`,
      "--slider-height-mobile": `${sliderHeightMobile}px`,
      "--initial-position-desktop": `${clampPosition(initialPositionDesktop)}%`,
      "--initial-position-mobile": `${clampPosition(initialPositionMobile)}%`,
      "--initial-clip-desktop": `${100 - clampPosition(initialPositionDesktop)}%`,
      "--initial-clip-mobile": `${100 - clampPosition(initialPositionMobile)}%`,
    } as CSSProperties;

    return (
      <div
        data-motion="slide-in"
        ref={setRefs}
        {...rest}
        className={clsx(
          "relative w-full select-none overflow-hidden bg-white",
          heightMode === "aspen"
            ? "aspect-[2/1]"
            : "h-[var(--slider-height-mobile)] md:h-[var(--slider-height-desktop)]",
        )}
        style={sliderStyle}
      >
        <div className="absolute inset-0">
          {afterImage ? (
            <Image
              data={afterImage}
              sizes="100vw"
              className="h-full w-full object-cover object-center"
            />
          ) : null}
        </div>

        <div
          className="absolute inset-0 z-1 [clip-path:inset(0_var(--initial-clip-mobile)_0_0)] md:[clip-path:inset(0_var(--initial-clip-desktop)_0_0)]"
          style={
            position === null
              ? undefined
              : { clipPath: `inset(0 ${100 - position}% 0 0)` }
          }
        >
          {beforeImage ? (
            <Image
              data={beforeImage}
              sizes="100vw"
              className="h-full w-full object-cover object-center"
            />
          ) : null}
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Before and after image comparison"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position ?? initialPositionMobile)}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          className="group absolute top-0 left-[var(--initial-position-mobile)] z-10 h-full cursor-ew-resize touch-none outline-none md:left-[var(--initial-position-desktop)]"
          style={{
            left: position === null ? undefined : `${position}%`,
            width: "var(--separator-width)",
            transform: "translateX(-50%)",
          }}
        >
          <div className="h-full w-full bg-[var(--separator-color)]" />

          {showList ? (
            <div
              className={clsx(
                "-translate-x-1/2 -translate-y-1/2 absolute left-1/2 flex h-14 w-10 items-center justify-center rounded-[20px] bg-[var(--separator-color)] group-focus-visible:ring-2 group-focus-visible:ring-(--color-text) group-focus-visible:ring-offset-2",
                heightMode === "aspen" ? "top-[57.6%] md:top-1/2" : "top-1/2",
              )}
            >
              <span
                className="flex h-[15px] w-3 items-stretch justify-between"
                aria-hidden="true"
              >
                <span className="w-[1.25px] rounded-full bg-[var(--list-color)]" />
                <span className="w-[1.25px] rounded-full bg-[var(--list-color)]" />
                <span className="w-[1.25px] rounded-full bg-[var(--list-color)]" />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

export default BeforeAndAfter;

export let schema: HydrogenComponentSchema = {
  type: "before-after-slider",
  title: "Slider",
  limit: 1,
  // toolbar: ["general-settings", ["duplicate", "delete"]],
  settings: [
    {
      group: "Images",
      inputs: [
        {
          type: "image",
          label: "Image (before)",
          name: "beforeImage1",
        },
        {
          type: "image",
          label: "Image (after)",
          name: "afterImage2",
        },
      ],
    },
    {
      group: "Handle",
      inputs: [
        {
          type: "color",
          label: "Separator color",
          name: "separatorColor",
          defaultValue: "#FFFFFF",
        },
        {
          type: "switch",
          name: "showList",
          label: "Show drag handle",
          defaultValue: true,
        },
        {
          type: "color",
          label: "Handle icon color",
          name: "listColor",
          defaultValue: "#524B46",
        },
        {
          type: "range",
          name: "separatorWidth",
          label: "Separator width",
          defaultValue: 8,
          configs: {
            min: 2,
            max: 12,
            step: 1,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "heightMode",
          label: "Section height",
          defaultValue: "aspen",
          configs: {
            options: [
              { value: "aspen", label: "Aspen design (2:1)" },
              { value: "custom", label: "Custom height" },
            ],
          },
        },
        {
          type: "range",
          name: "sliderHeightDesktop",
          label: "Slider height desktop",
          defaultValue: 600,
          configs: {
            min: 300,
            max: 1000,
            step: 10,
            unit: "px",
          },
          condition: (data: BeforeAndAfterProps) =>
            data.heightMode === "custom",
        },
        {
          type: "range",
          name: "sliderHeightMobile",
          label: "Slider height mobile",
          defaultValue: 200,
          configs: {
            min: 120,
            max: 1000,
            step: 10,
            unit: "px",
          },
          condition: (data: BeforeAndAfterProps) =>
            data.heightMode === "custom",
        },
        {
          type: "range",
          name: "initialPositionDesktop",
          label: "Initial divider position (desktop)",
          defaultValue: 51,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
          },
        },
        {
          type: "range",
          name: "initialPositionMobile",
          label: "Initial divider position (mobile)",
          defaultValue: 44,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
          },
        },
      ],
    },
  ],
  presets: {
    beforeImage1: IMAGES_PLACEHOLDERS.banner_1,
    afterImage2: IMAGES_PLACEHOLDERS.banner_2,
    separatorColor: "#FFFFFF",
    showList: true,
    listColor: "#524B46",
    separatorWidth: 8,
    heightMode: "aspen",
    initialPositionDesktop: 51,
    initialPositionMobile: 44,
  },
};
