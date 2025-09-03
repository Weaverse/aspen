import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { type CSSProperties, forwardRef } from "react";
import { cn } from "~/utils/cn";

let variants = cva("", {
  variants: {
    width: {
      full: "h-full w-full",
      fixed: "container mx-auto h-full w-full",
    },
  },
});

const MAX_DURATION = 20;

export interface ScrollingProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  content: string;
  textSize?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  scrollWidth?: "full" | "fixed";
  verticalPadding?: number;
  verticalMargin?: number;
  topbarScrollingSpeed?: number;
  gap?: number;
  visibleOnMobile?: boolean;
}

const ScrollingText = forwardRef<HTMLElement, ScrollingProps>((props, ref) => {
  let {
    content,
    textSize,
    textColor,
    borderColor,
    backgroundColor,
    scrollWidth,
    verticalPadding,
    verticalMargin,
    topbarScrollingSpeed,
    gap,
    visibleOnMobile,
    ...rest
  } = props;

  let sectionStyle: CSSProperties = {
    "--text-color": textColor,
    "--border-color": borderColor,
    "--background-color": backgroundColor,
    "--vertical-padding": `${verticalPadding}px`,
    "--vertical-margin": `${verticalMargin}px`,
    "--marquee-duration": `${MAX_DURATION / topbarScrollingSpeed}s`,
    "--gap": `${gap}px`,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      {...rest}
      style={sectionStyle}
      className={cn(
        "my-[var(--vertical-margin)] bg-[var(--background-color)] py-[var(--vertical-padding)]",
        "border-y border-y-[var(--border-color)]",
        "overflow-hidden",
        variants({ width: scrollWidth }),
        !visibleOnMobile && "hidden sm:block",
      )}
    >
      <div
        className="ff-heading block text-center text-base sm:hidden"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <ul className="hidden list-none sm:inline-flex">
        {Array.from({ length: 50 }).map((_, i) => (
          <li
            key={i}
            className="ff-heading animate-marquee whitespace-nowrap pr-[var(--gap)] font-medium text-[var(--text-color)]"
            style={{
              fontSize: `${textSize}px`,
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ))}
      </ul>
    </section>
  );
});

export default ScrollingText;

export let schema: HydrogenComponentSchema = {
  type: "scrolling-text",
  title: "Scrolling Text",
  inspector: [
    {
      group: "Scrolling Text",
      inputs: [
        {
          type: "richtext",
          name: "content",
          label: "Text",
          defaultValue:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        },
        {
          type: "toggle-group",
          label: "Text size",
          name: "textSize",
          configs: {
            options: [
              { label: "S", value: "16" },
              { label: "M", value: "18" },
              { label: "L", value: "20" },
            ],
          },
          defaultValue: "16",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text color",
        },
        {
          type: "color",
          name: "borderColor",
          label: "Border color",
          defaultValue: "#3D490B",
        },
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#F2F0EE",
        },
        {
          type: "select",
          name: "scrollWidth",
          label: "Content width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "full",
        },
        {
          type: "range",
          name: "verticalPadding",
          label: "Vertical padding",
          defaultValue: 10,
          configs: {
            min: 0,
            max: 30,
            step: 1,
            unit: "px",
          },
        },
        {
          type: "range",
          name: "verticalMargin",
          label: "Vertical margin",
          defaultValue: 0,
          configs: {
            min: 0,
            max: 30,
            step: 1,
            unit: "px",
          },
        },
        {
          type: "range",
          label: "Scrolling speed",
          name: "topbarScrollingSpeed",
          configs: {
            min: 1,
            max: 20,
            step: 1,
            unit: "x",
          },
          defaultValue: 1,
        },
        {
          type: "range",
          name: "gap",
          label: "Gap",
          defaultValue: 10,
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "px",
          },
        },
        {
          type: "switch",
          name: "visibleOnMobile",
          label: "Visible on mobile",
          defaultValue: true,
        },
      ],
    },
  ],
};
