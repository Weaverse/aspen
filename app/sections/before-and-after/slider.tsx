import {
  IMAGES_PLACEHOLDERS,
  type HydrogenComponentProps,
  type HydrogenComponentSchema,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import React, { forwardRef, type CSSProperties, useRef, useEffect } from "react";
// import { IconArrowSlideRight, IconArrowSlideLeft, IconImageBlank } from '~/components/Icon';
import { Image } from "@shopify/hydrogen";
import clsx from "clsx";
import { List } from "@phosphor-icons/react";

interface BeforeAndAfterProps extends HydrogenComponentProps {
  beforeImage1: WeaverseImage | string;
  afterImage2: WeaverseImage | string;
  separatorColor: string;
  showList: boolean;
  listColor: string;
  separatorWidth: number;
  sliderHeightDesktop: number;
  sliderHeightMobile: number;
}

const BeforeAndAfter = forwardRef<HTMLDivElement, BeforeAndAfterProps>(
  (props, ref) => {
    let {
      beforeImage1,
      afterImage2,
      separatorColor,
      showList,
      listColor,
      separatorWidth,
      sliderHeightDesktop,
      sliderHeightMobile,
      ...rest
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const firstHalfRef = useRef<HTMLDivElement>(null);
    const secondHalfRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);
    let beforeImage =
      typeof beforeImage1 === "string"
        ? { url: beforeImage1, altText: "Section background" }
        : beforeImage1;
    let afterImage =
      typeof afterImage2 === "string"
        ? { url: afterImage2, altText: "Section background" }
        : afterImage2;
    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      const startPos = {
        x: e.clientX,
        y: e.clientY,
      };
      const currentLeftWidth = parseFloat(
        window.getComputedStyle(resizerRef.current as Element).left
      );

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        updateWidth(currentLeftWidth, dx);
        updateCursor();
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        resetCursor();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      const startPos = {
        x: touch.clientX,
        y: touch.clientY,
      };
      const currentLeftWidth = parseFloat(
        window.getComputedStyle(resizerRef.current as Element).left
      );

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.x;
        const dy = touch.clientY - startPos.y;
        updateWidth(currentLeftWidth, dx);
        updateCursor();
      };

      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        resetCursor();
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, []);

    const updateWidth = (currentLeftWidth: number, dx: number) => {
      const container = containerRef.current;
      const firstHalfEle = firstHalfRef.current;
      const resizerEle = resizerRef.current;

      if (!container || !firstHalfEle || !resizerEle) {
        return;
      }

      const containerWidth = container.getBoundingClientRect().width;
      const delta = currentLeftWidth + dx;
      const newFirstHalfWidth = (delta * 100) / containerWidth;
      const normalizedWidth = Math.min(Math.max(0, newFirstHalfWidth), 100);

      firstHalfEle.style.clipPath = `inset(0 0 0 ${normalizedWidth}%)`;
      resizerEle.style.left = `${normalizedWidth}%`;
    };

    const updateCursor = () => {
      const container = containerRef.current;
      const firstHalfEle = firstHalfRef.current;
      const resizerEle = resizerRef.current;
      const secondHalfEle = secondHalfRef.current;

      if (!container || !firstHalfEle || !resizerEle || !secondHalfEle) {
        return;
      }

      resizerEle.style.cursor = "ew-resize";
      document.body.style.cursor = "ew-resize";
      firstHalfEle.style.userSelect = "none";
      firstHalfEle.style.pointerEvents = "none";
      secondHalfEle.style.userSelect = "none";
      secondHalfEle.style.pointerEvents = "none";
    };

    const resetCursor = () => {
      const container = containerRef.current;
      const firstHalfEle = firstHalfRef.current;
      const resizerEle = resizerRef.current;
      const secondHalfEle = secondHalfRef.current;

      if (!container || !firstHalfEle || !resizerEle || !secondHalfEle) {
        return;
      }

      resizerEle.style.removeProperty("cursor");
      document.body.style.removeProperty("cursor");
      firstHalfEle.style.removeProperty("user-select");
      firstHalfEle.style.removeProperty("pointer-events");
      secondHalfEle.style.removeProperty("user-select");
      secondHalfEle.style.removeProperty("pointer-events");
    };

    useEffect(() => {
      const resizerEle = resizerRef.current;
      const containerEle = containerRef.current;
      if (!resizerEle || !containerEle) return;
      const defaultWidth = 50;
      resizerEle.style.left = `${defaultWidth}%`;
      updateWidth(
        (defaultWidth * containerRef.current.getBoundingClientRect().width) /
          100,
        0
      );
    }, [afterImage]);

    let sliderStyle: CSSProperties = {
      "--separator-color": separatorColor,
      "--list-color": listColor,
      "--separator-width": `${separatorWidth}px`,
      "--slider-height-desktop": `${sliderHeightDesktop}px`,
      "--slider-height-mobile": `${sliderHeightMobile}px`,
    } as CSSProperties;

    return (
      <div
        data-motion="slide-in"
        ref={containerRef}
        {...rest}
        className="w-full relative h-[var(--slider-height-mobile)] sm:h-[var(--slider-height-desktop)] select-none"
        style={sliderStyle}
      >
        <div className="left-0 absolute top-0 h-full w-full" ref={firstHalfRef}>
          {afterImage && (
            <Image
              data={afterImage}
              sizes="auto"
              className="h-full w-full box-border object-cover object-center"
            />
          )}
        </div>
        <div
          ref={resizerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={clsx(
            "select-none touch-none left-1/2 absolute flex items-center top-0 h-full transform z-10",
            {
              "-translate-x-full": !showList,
              "-translate-x-1": showList,
            }
          )}
        >
          <div className="relative h-full">
            {/* Separator Bar */}
            <div className="h-full bg-[var(--separator-color)] cursor-ew-resize w-[var(--separator-width)] relative" />

            {/* List Icon */}
            {showList && (
              <div className="absolute flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <List
                  size={32}
                  className="text-[var(--list-color)] transform rotate-90 bg-[var(--separator-color)] rounded-full p-1"
                />
              </div>
            )}
          </div>
        </div>
        <div ref={secondHalfRef} className="h-full w-full">
          {beforeImage && (
            <Image
              data={beforeImage}
              sizes="auto"
              className="h-full w-full box-border object-cover object-center"
            />
          )}
        </div>
      </div>
    );
  }
);

export default BeforeAndAfter;

export let schema: HydrogenComponentSchema = {
  type: "before-after-slider",
  title: "Slider",
  limit: 1,
  // toolbar: ["general-settings", ["duplicate", "delete"]],
  inspector: [
    {
      group: "Slider",
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
        {
          type: "color",
          label: "Separator color",
          name: "separatorColor",
          defaultValue: "#333333",
        },
        {
          type: "switch",
          name: "showList",
          label: "Show list",
          defaultValue: true,
        },
        {
          type: "color",
          label: "List color",
          name: "listColor",
          defaultValue: "#ffffff",
        },
        {
          type: "range",
          name: "separatorWidth",
          label: "Separator width",
          defaultValue: 6,
          configs: {
            min: 2,
            max: 10,
            step: 1,
            unit: "px",
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
        },
        {
          type: "range",
          name: "sliderHeightMobile",
          label: "Slider height mobile",
          defaultValue: 400,
          configs: {
            min: 300,
            max: 1000,
            step: 10,
            unit: "px",
          },
        },
      ],
    },
  ],
  presets: {
    beforeImage1: IMAGES_PLACEHOLDERS.banner_1,
    afterImage2: IMAGES_PLACEHOLDERS.banner_2,
  },
};
