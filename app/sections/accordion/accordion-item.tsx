import { MinusCircle, PlusCircle } from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { forwardRef } from "react";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
}

const isSvgString = (icon: string) =>
  icon.trim().startsWith("<svg") || icon.trim().startsWith("<?xml");

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  (props, ref) => {
    const translateText = useTranslatedText();

    const {
      title: rawI18nTitle,
      content: rawI18nContent,
      icon,
      className,
      ...rest
    } = props;
    const content = translateText(
      rawI18nContent,
      "themeContent.sectionsAccordionAccordionItem.content",
    );
    const title = translateText(
      rawI18nTitle,
      "themeContent.sectionsAccordionAccordionItem.title",
    );

    const renderIcon = () => {
      if (!icon) {
        return null;
      }

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
        value={rawI18nTitle}
        className={cn(
          "flex w-full flex-col",
          "focus-within:relative focus-within:z-10",
          className,
        )}
        {...rest}
      >
        <Accordion.Header>
          <Accordion.Trigger
            style={
              {
                backgroundColor: "var(--accordion-bg-color)",
                color: "var(--accordion-text-color)",
              } as React.CSSProperties
            }
            className="group flex min-h-14 w-full items-center gap-3 rounded px-4 py-3 text-left"
          >
            {renderIcon()}
            <span className="flex-1 font-body font-normal text-base leading-[1.4] tracking-[0.02em]">
              {title}
            </span>
            <div className="relative ml-auto size-4 flex-shrink-0">
              <PlusCircle
                className="absolute inset-0 h-full w-full transition-opacity duration-200 group-data-[state=open]:opacity-0"
                color="currentColor"
                weight="regular"
                aria-hidden
              />
              <MinusCircle
                className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100"
                color="currentColor"
                weight="regular"
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
              backgroundColor: "var(--accordion-bg-color)",
              color: "var(--accordion-text-color)",
            } as React.CSSProperties
          }
          className={cn(
            "overflow-hidden rounded",
            "data-[state=closed]:animate-collapse",
            "data-[state=open]:mt-1 data-[state=open]:animate-expand",
          )}
        >
          <div className="flex w-full self-stretch items-start gap-2.5 p-4 text-sm leading-[1.6] opacity-75">
            <span className="min-w-0 flex-1">{content}</span>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    );
  },
);

export default AccordionItem;

export const schema: HydrogenComponentSchema = {
  type: "accordion--item",
  title: "Accordion Item",
  settings: [
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
