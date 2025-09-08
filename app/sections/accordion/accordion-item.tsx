import { MinusCircle, PlusCircle } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "~/utils/cn";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
}

const isSvgString = (icon: string) =>
  icon.trim().startsWith("<svg") || icon.trim().startsWith("<?xml");

function adjustColor(hex: string, amount: number) {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = Number.parseInt(color, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));

  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  (props, ref) => {
    const { title, content, icon, ...rest } = props;
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [highlightBg, setHighlightBg] = useState<string | null>(null);
    useEffect(() => {
      const current = triggerRef.current;
      if (!current) return;
      const sectionEl = current.closest("section") as HTMLElement | null; // hoặc closest()
      if (sectionEl) {
        const raw = getComputedStyle(sectionEl)
          .getPropertyValue("--section-bg-color")
          .trim();
        if (raw.startsWith("#")) {
          setHighlightBg(adjustColor(raw, 20));
        }
      }
    }, []);

    const renderIcon = () => {
      if (!icon) return null;

      if (isSvgString(icon)) {
        return (
          <span
            className="h-5 w-5"
            dangerouslySetInnerHTML={{ __html: icon }}
          />
        );
      }

      return (
        <Image
          src={icon}
          className="h-5 w-5"
          alt={title}
          width={20}
          height={20}
        />
      );
    };

    return (
      <Accordion.Item
        ref={ref}
        value={title}
        className={cn("w-full", "focus-within:relative focus-within:z-10")}
        {...rest}
      >
        <Accordion.Header>
          <Accordion.Trigger
            ref={triggerRef}
            style={{ backgroundColor: highlightBg } as React.CSSProperties}
            className="group mb-1 flex w-full items-center gap-3 p-4 text-left"
          >
            {renderIcon()}
            <span className="font-medium text-base">{title}</span>
            <div className="relative ml-auto h-5 w-5">
              <PlusCircle
                className="absolute inset-0 h-full w-full transition-opacity duration-200 group-data-[state=open]:opacity-0"
                fill="#918379"
                aria-hidden
              />
              <MinusCircle
                className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100"
                fill="#918379"
                aria-hidden
              />
            </div>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content
          style={
            {
              "--expand-to": "var(--radix-accordion-content-height)",
              "--expand-duration": "0.25s",
              "--collapse-from": "var(--radix-accordion-content-height)",
              "--collapse-duration": "0.25s",
              backgroundColor: highlightBg,
            } as React.CSSProperties
          }
          className={cn(
            "overflow-hidden",
            "data-[state=closed]:animate-collapse",
            "data-[state=open]:animate-expand",
          )}
        >
          <div className="p-4">{content}</div>
        </Accordion.Content>
      </Accordion.Item>
    );
  },
);

export default AccordionItem;

export const schema: HydrogenComponentSchema = {
  type: "accordion--item",
  title: "Accordion Item",
  inspector: [
    {
      group: "Accordion Item",
      inputs: [
        {
          type: "text",
          name: "icon",
          label: "Icon (optional)",
          helpText:
            "In this input we support URLs (http, https, /images/, .png, .svg, .jpg, ...).",
        },
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Accordion Item Title",
          placeholder: "Enter item title",
        },
        {
          type: "textarea",
          name: "content",
          label: "Content",
          defaultValue: "Accordion item content goes here.",
          placeholder: "Enter item content",
        },
      ],
    },
  ],
};
