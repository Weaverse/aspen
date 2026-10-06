import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Children,
  type CSSProperties,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";
import { ScrollingTextCopyContext } from "./item";

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
  const translateText = useTranslatedText();

  let {
    content: rawI18nContent,
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
    iconUrls: _legacyIconUrls,
    iconSize = 24,
    children,
    ...rest
  } = props;
  const content = translateText(
    rawI18nContent,
    "themeContent.sectionsScrollingTextIndex.content",
  );
  const hasItems = Children.toArray(children).length > 0;
  const viewportRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [repetitions, setRepetitions] = useState(1);
  useEffect(() => {
    if (layoutStyle !== "style2" || !hasItems) {
      return;
    }
    const viewport = viewportRef.current;
    const sequence = sequenceRef.current;
    if (!(viewport && sequence)) {
      return;
    }
    const update = () => {
      const width = sequence.getBoundingClientRect().width;
      if (width > 0) {
        setRepetitions(Math.ceil(viewport.clientWidth / width) + 1);
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(sequence);
    update();
    return () => observer.disconnect();
  }, [layoutStyle, hasItems]);

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
      {layoutStyle === "style2" ? (
        <div
          ref={viewportRef}
          className="flex font-heading text-(--text-color)"
          style={{ fontSize: `${textSize}px` }}
        >
          {hasItems &&
            [0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                inert={copy === 1 ? true : undefined}
                className="flex shrink-0 animate-marquee items-center motion-reduce:animate-none"
              >
                {Array.from({ length: repetitions }, (_, repetition) => (
                  <div
                    key={repetition}
                    aria-hidden={repetition > 0 ? true : undefined}
                    inert={repetition > 0 ? true : undefined}
                    ref={
                      copy === 0 && repetition === 0 ? sequenceRef : undefined
                    }
                    className="flex shrink-0 items-center gap-(--gap) pr-(--gap)"
                  >
                    <ScrollingTextCopyContext.Provider
                      value={copy === 1 || repetition > 0}
                    >
                      {children}
                    </ScrollingTextCopyContext.Provider>
                  </div>
                ))}
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="ff-heading block text-center text-base sm:hidden">
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <ul className="hidden list-none sm:inline-flex">
            {(() => {
              const createItems = (startKey: number) => {
                const baseRepetitions = 25;

                return Array.from({ length: baseRepetitions }).map((_, i) => {
                  return (
                    <li
                      key={`${startKey}-${i}`}
                      className="ff-heading animate-marquee whitespace-nowrap pr-[var(--gap)] font-normal tracking-[-0.02em] text-[var(--text-color)]"
                      style={{
                        fontSize: `${textSize}px`,
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: content }} />
                    </li>
                  );
                });
              };

              return [...createItems(0), ...createItems(1)];
            })()}
          </ul>
        </>
      )}
    </section>
  );
});

export default ScrollingText;

export let schema: HydrogenComponentSchema = {
  type: "scrolling-text",
  title: "Scrolling Text",
  childTypes: ["scrolling-text--item"],
  settings: [
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
          helpText:
            "Style 1 uses the section Text. Style 2 uses Icon and text child items; add items to populate the scrolling content.",
        },
        {
          type: "textarea",
          name: "iconUrls",
          label: "Icons (one per line)",
          placeholder: "<svg>...</svg>\nhttps://example.com/icon.png",
          defaultValue: "",
          // Retain the saved field without exposing an inactive Studio control.
          condition: () => false,
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
          condition: (data: ScrollingProps) => data.layoutStyle !== "style2",
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
              { label: "XL", value: "32" },
            ],
          },
          defaultValue: "32",
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
          defaultValue: 24,
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
  presets: {
    children: [
      {
        type: "scrolling-text--item",
        content: "Text content A",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10 12 2l9 8v12h-6v-8H9v8H3Z"/></svg>',
      },
      {
        type: "scrolling-text--item",
        content: "Text content B",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>',
      },
      {
        type: "scrolling-text--item",
        content: "Text content C",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2-7 9h3l-5 7h7v4h4v-4h7l-5-7h3Z"/></svg>',
      },
      {
        type: "scrolling-text--item",
        content: "Text content D",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20h2a3 3 0 0 0 0-6h-1a1 1 0 0 1 0-2h3a6 6 0 0 0 6-6c0-4-5-6-10-6Z"/></svg>',
      },
    ],
  },
};
