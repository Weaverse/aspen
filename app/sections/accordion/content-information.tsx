import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { cn } from "~/utils/cn";
import { useAccordionContext } from "./index";

interface ContentInformationProps extends HydrogenComponentProps {
  gap?: number;
}

const ContentInformation = forwardRef<HTMLDivElement, ContentInformationProps>(
  (props, ref) => {
    let { children, gap: _gap, ...rest } = props;
    const { layout } = useAccordionContext();

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "flex flex-col gap-0",
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
