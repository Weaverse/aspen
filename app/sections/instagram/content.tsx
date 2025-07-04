import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";

let variants = cva(
  "flex flex-col gap-6 text-center md:w-1/4 w-full",
  {
    variants: {
      alignment: {
        left: "items-start text-left",
        center: "items-center text-center",
        right: "items-end text-right",
      },
    },
    defaultVariants: {
      alignment: "center",
    },
  }
);

interface InstagramContentProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  title: string;
  subtitle: string;
  description: string;
}

let InstagramContent = forwardRef<HTMLDivElement, InstagramContentProps>(
  (props, ref) => {
    let { alignment, title, subtitle, description, children, ...rest } = props;

    return (
      <div ref={ref} {...rest} className={variants({ alignment })}>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Tenor_Sans'] text-[37px] leading-[1.1] tracking-[-0.02em] text-[#29231E]">
              {title}
            </h2>
            <p className="font-['Open_Sans'] text-[14px] leading-[1em] tracking-[0.02em] text-[#524B46]">
              {subtitle}
            </p>
          </div>
          <p className="font-['Open_Sans'] text-[14px] leading-[1.6] tracking-[0.02em] text-[#524B46]">
            {description}
          </p>
        </div>
        {children}
      </div>
    );
  },
);

export default InstagramContent;

export let schema = createSchema({
  type: "instagram--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Instagram",
        },
        {
          type: "text",
          name: "subtitle",
          label: "Subtitle",
          defaultValue: "@instagram",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue: "Meet the room edits: real life shots of our furniture in action. (We like to think we style our furniture well, but we can't help but show off how you do it.)",
        },
        {
          type: "select",
          name: "alignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          },
          defaultValue: "center",
        },
      ],
    },
  ],
  childTypes: ["button"],
  presets: {
    title: "Instagram",
    subtitle: "@instagram",
    description: "Meet the room edits: real life shots of our furniture in action. (We like to think we style our furniture well, but we can't help but show off how you do it.)",
    alignment: "center",
  },
}); 