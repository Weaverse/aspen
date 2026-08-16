import { createSchema } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { forwardRef } from "react";
import { useRouteLoaderData } from "react-router";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { cn } from "~/utils/cn";

interface NewsletterProps extends SectionProps {
  mobileHeight?: number;
  desktopHeight?: number;
  hideOnProductPage?: boolean;
}

const Newsletter = forwardRef<HTMLElement, NewsletterProps>((props, ref) => {
  const {
    children,
    mobileHeight = 326,
    desktopHeight = 291,
    hideOnProductPage = true,
    width = "full",
    backgroundColor = "#EDEDED",
    containerClassName,
    style,
    ...rest
  } = props;
  const productRouteData = useRouteLoaderData<typeof productRouteLoader>(
    "routes/($locale).products.$productHandle",
  );

  if (hideOnProductPage && productRouteData?.product) {
    return null;
  }

  return (
    <Section
      ref={ref}
      {...rest}
      backgroundColor={backgroundColor}
      backgroundFor="section"
      containerClassName={cn(
        "flex h-(--newsletter-mobile-height) w-full flex-col items-center px-5 pt-16 md:h-(--newsletter-desktop-height)",
        "[&>.heading]:w-full [&>.heading]:shrink-0 [&>.heading]:font-heading [&>.heading]:text-[32px] [&>.heading]:text-[#343231] [&>.heading]:leading-[1.1] [&>.heading]:[text-wrap:wrap] md:[&>.heading]:[text-wrap:balance]",
        "[&>.paragraph]:mt-5 [&>.paragraph]:w-full [&>.paragraph]:shrink-0 [&>.paragraph]:font-body [&>.paragraph]:text-sm [&>.paragraph]:text-[#343231] [&>.paragraph]:leading-[1.5]",
        "[&>.newsletter-form]:mt-8 [&>.newsletter-form]:shrink-0",
        containerClassName,
      )}
      gap={0}
      overflow="hidden"
      style={
        {
          ...style,
          "--newsletter-mobile-height": `${mobileHeight}px`,
          "--newsletter-desktop-height": `${desktopHeight}px`,
        } as CSSProperties
      }
      verticalPadding="none"
      width={width}
    >
      {children}
    </Section>
  );
});

export default Newsletter;

export const schema = createSchema({
  type: "newsletter",
  title: "Newsletter",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "switch",
          name: "hideOnProductPage",
          label: "Hide on product pages",
          defaultValue: true,
        },
        {
          type: "range",
          name: "mobileHeight",
          label: "Mobile height",
          configs: {
            min: 260,
            max: 480,
            step: 1,
            unit: "px",
          },
          defaultValue: 326,
        },
        {
          type: "range",
          name: "desktopHeight",
          label: "Desktop height",
          configs: {
            min: 240,
            max: 480,
            step: 1,
            unit: "px",
          },
          defaultValue: 291,
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 1,
            unit: "px",
          },
          defaultValue: 0,
        },
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs.filter(
        (input) => input.name !== "backgroundFor",
      ),
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "newsletter-form"],
  presets: {
    width: "full",
    backgroundColor: "#EDEDED",
    mobileHeight: 326,
    desktopHeight: 291,
    hideOnProductPage: true,
    children: [
      {
        type: "heading",
        as: "h2",
        content: "Subscribe to our Newsletter",
        size: "custom",
        mobileSize: "3xl",
        desktopSize: "3xl",
        weight: "400",
        letterSpacing: "normal",
        alignment: "center",
        color: "#343231",
      },
      {
        type: "paragraph",
        content: "Subscribe and save more",
        textSize: "sm",
        width: "full",
        alignment: "center",
        color: "#343231",
      },
      {
        type: "newsletter-form",
        width: 372,
        placeholder: "Please enter your email",
        buttonText: "Send",
        helpText: "",
        inputBackgroundColor: "#FFFFFF",
        inputTextColor: "#343231",
        inputBorderColor: "#9D9D9D",
        placeholderColor: "#979797",
        buttonBackgroundColor: "#4D4946",
        buttonTextColor: "#F1EEEA",
        buttonHoverBackgroundColor: "#343231",
        buttonHoverTextColor: "#FFFFFF",
        borderRadius: 8,
        buttonWidth: 83,
      },
    ],
  },
});
