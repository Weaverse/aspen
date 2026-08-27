import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useThemeSettings,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Children, forwardRef } from "react";
import { useRouteLoaderData } from "react-router";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";

export interface HeroImageProps extends VariantProps<typeof variants> {}

const variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    height: {
      small: "min-h-[40vh] lg:min-h-[50vh]",
      medium: "min-h-[50vh] lg:min-h-[60vh]",
      large: "min-h-[70vh] lg:min-h-[80vh]",
      full: "",
    },
    enableTransparentHeader: {
      true: "",
      false: "",
    },
    contentPosition: {
      "top left": "items-start justify-start [&_.paragraph]:text-left",
      "top center": "items-center justify-start [&_.paragraph]:text-center",
      "top right": "items-end justify-start [&_.paragraph]:text-right",
      "center left": "items-start justify-center [&_.paragraph]:text-left",
      "center center": "items-center justify-center [&_.paragraph]:text-center",
      "center right": "items-end justify-center [&_.paragraph]:text-right",
      "bottom left": "items-start justify-end [&_.paragraph]:text-left",
      "bottom center": "items-center justify-end [&_.paragraph]:text-center",
      "bottom right": "items-end justify-end [&_.paragraph]:text-right",
    },
  },
  compoundVariants: [
    {
      height: "full",
      enableTransparentHeader: true,
      className: "h-screen-no-topbar",
    },
    {
      height: "full",
      enableTransparentHeader: false,
      className: "h-screen-dynamic",
    },
  ],
  defaultVariants: {
    height: "large",
    contentPosition: "center center",
  },
});

const HeroImage = forwardRef<HTMLElement, HeroImageProps & SectionProps>(
  (props, ref) => {
    const { children, height, contentPosition, ...rest } = props;
    const { enableTransparentHeader } = useThemeSettings();
    const productRouteData = useRouteLoaderData<typeof productRouteLoader>(
      "routes/($locale).products.$productHandle",
    );

    // The default product template used an empty hero as a product-detail
    // image. Main Product now owns the complete responsive story experience,
    // so suppress only that legacy empty block on product routes.
    if (productRouteData?.product && Children.count(children) === 0) {
      return null;
    }

    return (
      <Section
        ref={ref}
        {...rest}
        containerClassName={variants({
          contentPosition,
          height,
          enableTransparentHeader,
        })}
      >
        {children}
      </Section>
    );
  },
);

export default HeroImage;

export const schema = createSchema({
  type: "hero-image",
  title: "Hero image",
  settings: [
    {
      group: "Layout",
      inputs: [
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
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundFor" && inp.name !== "backgroundColor",
        ),
      ],
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    height: "large",
    contentPosition: "center center",
    width: "full",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayColor: "#1B1B19",
    overlayOpacity: 28,
    children: [
      {
        type: "heading",
        content: "THE KITCHEN THAT INSPIRES",
        as: "h1",
        color: "#FEF4EB",
        size: "scale",
        minSize: 36,
        maxSize: 64,
        weight: "400",
        letterSpacing: "tight",
      },
      {
        type: "paragraph",
        content:
          "Thoughtful furniture and warm materials for the rooms where life happens.",
        color: "#FEF4EB",
        textSize: "base",
        width: "narrow",
        alignment: "center",
      },
      {
        type: "button",
        text: "SHOP NOW",
        to: "/collections/all",
        variant: "secondary",
      },
    ],
  },
});
