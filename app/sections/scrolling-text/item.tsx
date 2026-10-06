import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { createContext, forwardRef, useContext } from "react";
import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";

interface ItemProps extends Partial<HydrogenComponentProps> {
  content: string;
  icon?: string;
}

export const ScrollingTextCopyContext = createContext(false);

export const ScrollingTextContent = ({ content, icon }: ItemProps) => (
  <>
    {icon && (
      <span className="inline-flex size-(--icon-size) shrink-0 items-center justify-center [&_svg]:size-full">
        {icon.trim().startsWith("<svg") ? (
          <span
            className="size-full"
            dangerouslySetInnerHTML={{ __html: icon }}
          />
        ) : (
          // biome-ignore lint/performance/noImgElement: Merchant icons are arbitrary URLs.
          <img
            src={icon}
            alt=""
            width="24"
            height="24"
            className="size-full object-contain"
          />
        )}
      </span>
    )}
    <span
      className="[&_p]:m-0 [&_p]:inline"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  </>
);

const ScrollingTextItem = forwardRef<HTMLDivElement, ItemProps>(
  (props, ref) => {
    const { content, icon, className, ...rest } = props;
    const isCopy = useContext(ScrollingTextCopyContext);
    const attributes = isCopy
      ? Object.fromEntries(
          Object.entries(rest).filter(
            ([key]) => !key.startsWith("data-wv") && key !== "id",
          ),
        )
      : rest;
    const translateText = useTranslatedText();
    return (
      <div
        ref={isCopy ? undefined : ref}
        {...attributes}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 whitespace-nowrap",
          className,
        )}
      >
        <ScrollingTextContent
          icon={icon}
          content={translateText(
            content,
            "themeContent.sectionsScrollingTextItem.content",
          )}
        />
      </div>
    );
  },
);

export default ScrollingTextItem;

export const schema = createSchema({
  type: "scrolling-text--item",
  title: "Icon and text",
  settings: [
    {
      group: "Content",
      inputs: [
        { type: "textarea", name: "icon", label: "Icon (SVG or image URL)" },
        {
          type: "richtext",
          name: "content",
          label: "Text",
          defaultValue: "Text content",
        },
      ],
    },
  ],
});
