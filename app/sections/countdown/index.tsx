import { createSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";

const variants = cva("flex items-start justify-center lg:items-end", {
  variants: {
    height: {
      small: "min-h-[360px] lg:h-[620px]",
      medium: "h-[544px] lg:h-[840px]",
      large: "h-[544px] lg:h-[840px]",
      full: "min-h-screen",
    },
    defaultVariants: {
      height: "small",
    },
  },
});

interface CountdownProps extends VariantProps<typeof variants>, SectionProps {
  scenario?: "scenario1" | "scenario2";
  style2VerticalPadding?: number;
  style2Heading?: string;
  style2Description?: string;
}

const Countdown = forwardRef<HTMLElement, CountdownProps>((props, ref) => {
  const {
    children,
    height,
    scenario = "scenario1",
    style2VerticalPadding = 56,
    style2Heading = "Limited Sale Offers",
    style2Description = "Up to 50% including Best Sellers",
    ...rest
  } = props;
  const isScenario2 = scenario === "scenario2";

  return (
    <Section
      ref={ref}
      {...rest}
      verticalPadding="none"
      backgroundImage={isScenario2 ? undefined : rest.backgroundImage}
      backgroundColor={
        isScenario2 ? rest.backgroundColor || "#F4EFEB" : rest.backgroundColor
      }
      enableOverlay={isScenario2 ? false : rest.enableOverlay}
      className={cn(rest.className, isScenario2 && "bg-[#f4efeb]")}
    >
      <div
        className={cn(
          isScenario2
            ? "flex min-h-[456px] items-center justify-center md:min-h-[175px]"
            : variants({ height }),
        )}
        style={
          isScenario2
            ? {
                paddingTop: style2VerticalPadding,
                paddingBottom: style2VerticalPadding,
              }
            : undefined
        }
      >
        <div
          className={cn(
            "grid w-full grid-cols-1",
            isScenario2
              ? "mx-auto max-w-[1360px] items-center gap-y-8 px-5 md:grid-cols-[minmax(0,1fr)_auto_220px] md:gap-x-12 md:gap-y-0 md:px-0"
              : "countdown-wrapper mx-auto max-w-[1440px] gap-y-6 px-5 pt-10 lg:grid-cols-[repeat(2,minmax(0,684px))] lg:gap-x-[72px] lg:gap-y-8 lg:px-0 lg:pt-0 lg:pb-16",
            isScenario2
              ? "[&_.button-countdown]:order-3 [&_.button-countdown]:justify-center md:[&_.button-countdown]:col-start-3 md:[&_.button-countdown]:row-start-1 [&_.countdown--timer]:order-2 md:[&_.countdown--timer]:col-start-2 md:[&_.countdown--timer]:row-start-1 [&_.paragraph]:hidden [&_.subheading]:hidden"
              : "[&_.button-countdown]:order-4 [&_.button-countdown]:mt-1 [&_.button-countdown]:h-fit [&_.button-countdown]:justify-start lg:[&_.button-countdown]:col-start-2 lg:[&_.button-countdown]:row-start-2 lg:[&_.button-countdown]:mt-[26px] [&_.countdown--timer]:order-2 lg:[&_.countdown--timer]:col-start-1 lg:[&_.countdown--timer]:row-start-2 [&_.paragraph]:order-3 [&_.paragraph]:max-w-[684px] [&_.paragraph]:text-sm lg:[&_.paragraph]:col-start-2 lg:[&_.paragraph]:row-start-1 [&_.subheading]:order-1 lg:[&_.subheading]:col-start-1 lg:[&_.subheading]:row-start-1",
          )}
        >
          {isScenario2 && (
            <div className="order-1 flex flex-col gap-3 md:col-start-1 md:row-start-1">
              <h2 className="max-w-[300px] text-[30px] leading-[1.05] md:text-[36px]">
                {style2Heading}
              </h2>
              <p className="text-[11px] opacity-70 md:text-xs">
                {style2Description}
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </Section>
  );
});

export default Countdown;

export const schema = createSchema({
  type: "countdown",
  title: "Countdown",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "scenario",
          label: "Layout",
          defaultValue: "scenario1",
          configs: {
            options: [
              { value: "scenario1", label: "Style 1" },
              { value: "scenario2", label: "Style 2" },
            ],
          },
        },
        {
          type: "select",
          name: "width",
          label: "Content width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "stretch", label: "Stretch" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "fixed",
        },
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
            ],
          },
          defaultValue: "large",
          condition: "scenario.eq.scenario1",
        },
        {
          type: "range",
          name: "style2VerticalPadding",
          label: "Vertical padding",
          configs: {
            min: 0,
            max: 200,
            step: 8,
            unit: "px",
          },
          defaultValue: 80,
          condition: "scenario.eq.scenario2",
        },
        {
          type: "text",
          name: "style2Heading",
          label: "Style 2 heading",
          defaultValue: "Limited Sale Offers",
          condition: "scenario.eq.scenario2",
        },
        {
          type: "text",
          name: "style2Description",
          label: "Style 2 description",
          defaultValue: "Up to 50% including Best Sellers",
          condition: "scenario.eq.scenario2",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
      ],
    },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: [
    "subheading--countdown",
    "paragraph",
    "countdown--timer",
    "button--countdown",
  ],
  presets: {
    backgroundImage:
      "https://cdn.shopify.com/s/files/1/0969/1650/4944/files/00____cover_1920_1536.webp?v=1756974435",
    width: "full",
    height: "medium",
    enableOverlay: true,
    overlayColor: "#1B1B19",
    overlayOpacity: 36,
    style2VerticalPadding: 56,
    style2Heading: "Limited Sale Offers",
    style2Description: "Up to 50% including Best Sellers",
    children: [
      {
        type: "subheading--countdown",
        content: "Seasonal Sale",
        color: "#FEF4EB",
        backgroundColor: "#434343",
      },
      {
        type: "paragraph",
        content:
          "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
        width: "full",
        color: "#FEF4EB",
      },
      {
        type: "countdown--timer",
        textColor: "#FEF4EB",
        scenario1MobileNumberSize: 48,
        scenario1DesktopNumberSize: 80,
        scenario2MobileNumberSize: 36,
        scenario2DesktopNumberSize: 48,
        mobileLabelSize: 10,
        desktopLabelSize: 12,
      },
      {
        type: "button--countdown",
        text: "DISCOVER NOW",
        style2Text: "Shop Now",
        to: "/collections/all",
        variant: "custom",
        backgroundColor: "#FEF4EB",
        textColor: "#343231",
        borderColor: "#FEF4EB",
        backgroundColorHover: "#EDE6DF",
        textColorHover: "#343231",
        borderColorHover: "#FEF4EB",
      },
    ],
  },
});
