import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "~/utils/cn";
import { useAccordionContext } from "./index";

const variants = cva("", {
  variants: {
    gap: {
      0: "",
      4: "space-y-1",
      8: "space-y-2",
      12: "space-y-3",
      16: "space-y-4",
      20: "space-y-5",
      24: "space-y-3 lg:space-y-6",
      28: "space-y-3.5 lg:space-y-7",
      32: "space-y-4 lg:space-y-8",
      36: "space-y-4 lg:space-y-9",
      40: "space-y-5 lg:space-y-10",
      44: "space-y-5 lg:space-y-11",
      48: "space-y-6 lg:space-y-12",
      52: "space-y-6 lg:space-y-[52px]",
      56: "space-y-7 lg:space-y-14",
      60: "space-y-7 lg:space-y-[60px]",
    },
  },
  defaultVariants: { gap: 28 },
});

interface ContentInformationProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {}

const ContentInformation = forwardRef<HTMLDivElement, ContentInformationProps>(
  (props, ref) => {
    let { children, gap, ...rest } = props;
    const { layout } = useAccordionContext();

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "flex flex-col",
          variants({ gap }),
          "[&_.heading]:mb-0 [&_.heading]:text-[30px] [&_.heading]:leading-[1.05] lg:[&_.heading]:text-[36px]",
          "[&_.subheading]:mt-0 [&_.subheading]:font-heading [&_.subheading]:text-[24px] [&_.subheading]:font-normal [&_.subheading]:leading-none",
          "[&_.heading+.subheading]:mt-0",
          layout === "column"
            ? [
                "[&_.subheading+.paragraph]:mt-10",
                "[&_.paragraph+.paragraph]:mt-6",
                "[&_.paragraph]:font-body [&_.paragraph]:text-[16px] [&_.paragraph]:font-normal [&_.paragraph]:leading-[1.4] [&_.paragraph]:tracking-[0.32px] [&_.paragraph]:text-(--color-text-subtle)",
                "[&_.paragraph_p]:m-0 [&_.paragraph_p]:font-body [&_.paragraph_p]:text-[16px] [&_.paragraph_p]:font-normal [&_.paragraph_p]:leading-[1.4] [&_.paragraph_p]:tracking-[0.32px] [&_.paragraph_p]:text-(--color-text-subtle)",
              ]
            : "[&>*:nth-child(n+3)]:hidden",
        )}
      >
        {children}
      </div>
    );
  },
);

export default ContentInformation;

export const schema = createSchema({
  type: "content-information",
  title: "Content Information",
  settings: [
    {
      group: "Content settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: { min: 0, max: 60, step: 4, unit: "px" },
          defaultValue: 20,
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph"],
  presets: {
    children: [
      {
        type: "heading",
        content: "CUSTOMER SERVICE",
        alignment: "left",
      },
      {
        type: "subheading",
        content: "We offer support via email.",
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "<p>Email</p><p>support@archercommerce.com</p>",
        width: "full",
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "<p>Hours</p><p>Monday - Friday, 9AM - 5PM ET</p>",
        width: "full",
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "<p>Average response time</p><p>1 Business day</p>",
        width: "full",
        alignment: "left",
      },
    ],
  },
});
