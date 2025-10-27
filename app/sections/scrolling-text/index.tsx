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
  layoutStyle?: "style1" | "style2";
  iconUrls?: string;
  iconSize?: number;
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
    layoutStyle = "style1",
    iconUrls = "",
    iconSize = 24,
    ...rest
  } = props;
  const parseIcons = (text: string) => {
    const items: Array<{ content: string; isSvg: boolean }> = [];
    const lines = text.split("\n");
    let currentSvg = "";
    let inSvg = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("<svg")) {
        inSvg = true;
        currentSvg = line;

        if (trimmedLine.includes("</svg>")) {
          items.push({
            content: currentSvg,
            isSvg: true,
          });
          currentSvg = "";
          inSvg = false;
        }
      } else if (inSvg) {
        currentSvg += `\n${line}`;

        if (trimmedLine.includes("</svg>")) {
          items.push({
            content: currentSvg,
            isSvg: true,
          });
          currentSvg = "";
          inSvg = false;
        }
      } else if (trimmedLine && !inSvg) {
        // It's a URL or other content
        items.push({
          content: trimmedLine,
          isSvg: false,
        });
      }
    }

    return items;
  };

  const icons = parseIcons(iconUrls);

  let sectionStyle: CSSProperties = {
    "--text-color": textColor,
    "--border-color": borderColor,
    "--background-color": backgroundColor,
    "--vertical-padding": `${verticalPadding}px`,
    "--vertical-margin": `${verticalMargin}px`,
    "--marquee-duration": `${MAX_DURATION / topbarScrollingSpeed}s`,
    "--gap": `${gap}px`,
    "--icon-size": `${iconSize}px`,
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
      <div className="ff-heading block text-center text-base sm:hidden">
        {layoutStyle === "style2" && icons.length > 0 && (
          <span
            className="mr-2 inline-flex items-center justify-center align-middle [&_svg]:h-full [&_svg]:w-full"
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              flexShrink: 0,
            }}
          >
            {icons[0].isSvg ? (
              <span
                dangerouslySetInnerHTML={{ __html: icons[0].content }}
                className="inline-flex h-full w-full items-center justify-center"
              />
            ) : (
              <img
                src={icons[0].content}
                alt="icon"
                className="h-full w-full object-contain"
              />
            )}
          </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <ul className="hidden list-none sm:inline-flex">
        {(() => {
          const createItems = (startKey: number) => {
            const baseRepetitions = 25;
            const repetitions =
              layoutStyle === "style2" && icons.length > 0
                ? Math.ceil(baseRepetitions / icons.length) * icons.length
                : baseRepetitions;

            return Array.from({ length: repetitions }).map((_, i) => {
              const iconIndex =
                layoutStyle === "style2" && icons.length > 0
                  ? i % icons.length
                  : 0;
              const currentIcon = icons[iconIndex];

              return (
                <li
                  key={`${startKey}-${i}`}
                  className="ff-heading animate-marquee whitespace-nowrap pr-[var(--gap)] font-medium text-[var(--text-color)]"
                  style={{
                    fontSize: `${textSize}px`,
                  }}
                >
                  {layoutStyle === "style2" && icons.length > 0 && (
                    <span
                      className="mr-2 inline-flex items-center justify-center align-middle [&_svg]:h-full [&_svg]:w-full"
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                        flexShrink: 0,
                      }}
                    >
                      {currentIcon.isSvg ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: currentIcon.content,
                          }}
                          className="inline-flex h-full w-full items-center justify-center"
                        />
                      ) : (
                        <img
                          src={currentIcon.content}
                          alt="icon"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </span>
                  )}
                  <span dangerouslySetInnerHTML={{ __html: content }} />
                </li>
              );
            });
          };

          return [...createItems(0), ...createItems(1)];
        })()}
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
          type: "toggle-group",
          name: "layoutStyle",
          label: "Layout style",
          defaultValue: "style1",
          configs: {
            options: [
              { label: "Style 1", value: "style1" },
              { label: "Style 2", value: "style2" },
            ],
          },
        },
        {
          type: "textarea",
          name: "iconUrls",
          label: "Icons (one per line)",
          placeholder: "<svg>...</svg>\nhttps://example.com/icon.png",
          defaultValue: "",
          condition: (data: ScrollingProps) => data.layoutStyle === "style2",
          helpText:
            "Enter inline SVG code or image URLs (PNG, JPEG). Each line = one icon. Icons will rotate through the scrolling text.",
        },
        {
          type: "range",
          name: "iconSize",
          label: "Icon size",
          defaultValue: 24,
          configs: {
            min: 16,
            max: 64,
            step: 2,
            unit: "px",
          },
          condition: (data: ScrollingProps) => data.layoutStyle === "style2",
        },
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
