import {
  createSchema,
  type HydrogenComponentProps,
  useChildInstances,
  useParentInstance,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import { forwardRef, useCallback, useSyncExternalStore } from "react";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import Link, { type LinkProps, linkInputs } from "~/components/link";
import Paragraph, { type ParagraphProps } from "~/components/paragraph";

interface CollectionListDynamicProps
  extends HydrogenComponentProps,
    VariantProps<typeof variants>,
    Omit<HeadingProps, "content"> {
  // Layout props
  displayMode?: "vertical" | "horizontal";
  // Heading props
  headingContent?: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  sliderHeadingContent?: string;
  // Paragraph props
  paragraphContent?: string;
  paragraphTag?: "p" | "div";
  paragraphColor?: string;
  paragraphSize?: ParagraphProps["textSize"];
  paragraphAlignment?: ParagraphProps["alignment"];
  paragraphWidth?: ParagraphProps["width"];
  // Button/Link props
  buttonContent?: string;
  sliderButtonContent?: string;
  to?: LinkProps["to"];
  sliderTo?: LinkProps["to"];
  variant?: LinkProps["variant"];
  openInNewTab?: boolean;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColorHover?: string;
  backgroundColorHover?: string;
  borderColorHover?: string;
  textColorDecor?: string;
}

type CollectionLayout = "grid" | "slider" | "showcase";
type CollectionChildData = {
  type?: string;
  layout?: CollectionLayout;
};
const noopUnsubscribe = () => undefined;

let variants = cva("flex flex-col [&_.paragraph]:mx-[unset]", {
  variants: {
    contentPosition: {
      left: "items-start justify-center [&_.paragraph]:[text-align:left]",
      center: "items-center justify-center [&_.paragraph]:[text-align:center]",
      right: "items-end justify-center [&_.paragraph]:[text-align:right]",
    },
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    contentPosition: "center",
    gap: 24,
  },
});

let CollectionContentDynamic = forwardRef<
  HTMLDivElement,
  CollectionListDynamicProps
>((props, ref) => {
  const parentInstance = useParentInstance();
  const serializedCollectionLayout = (
    parentInstance?.data.children as CollectionChildData[] | undefined
  )?.find((child) => child.type === "collection-list-dynamic-items")?.layout;
  const siblingInstances = useChildInstances(parentInstance?._id);
  const collectionItemsInstance = siblingInstances.find(
    (instance) => instance.data.type === "collection-list-dynamic-items",
  );
  const subscribeToCollectionLayout = useCallback(
    (onStoreChange: () => void) =>
      collectionItemsInstance?.subscribe(onStoreChange) ?? noopUnsubscribe,
    [collectionItemsInstance],
  );
  const getCollectionLayout = useCallback(
    () => collectionItemsInstance?.data.layout as CollectionLayout | undefined,
    [collectionItemsInstance],
  );
  const getServerCollectionLayout = useCallback(
    () => serializedCollectionLayout,
    [serializedCollectionLayout],
  );
  const collectionLayout = useSyncExternalStore(
    subscribeToCollectionLayout,
    getCollectionLayout,
    getServerCollectionLayout,
  );

  const {
    gap,
    contentPosition,
    displayMode = "vertical",
    // Heading props
    headingContent,
    headingTagName,
    sliderHeadingContent,
    color,
    size,
    mobileSize,
    desktopSize,
    weight,
    letterSpacing,
    alignment,
    minSize,
    maxSize,
    animate,
    // Paragraph props
    paragraphContent,
    paragraphTag = "p",
    paragraphColor,
    paragraphSize,
    paragraphAlignment,
    paragraphWidth,
    // Button/Link props
    buttonContent,
    sliderButtonContent,
    to,
    sliderTo,
    variant,
    openInNewTab,
    textColor,
    backgroundColor,
    borderColor,
    textColorHover,
    backgroundColorHover,
    borderColorHover,
    textColorDecor,
    ...rest
  } = props;
  const effectiveDisplayMode = collectionLayout
    ? collectionLayout === "slider"
      ? "horizontal"
      : "vertical"
    : displayMode;
  const isSliderLayout = effectiveDisplayMode === "horizontal";
  const effectiveHeadingContent = isSliderLayout
    ? (sliderHeadingContent ?? "COLLECTIONS")
    : headingContent;
  const effectiveButtonContent = isSliderLayout
    ? (sliderButtonContent ?? "VIEW ALL")
    : buttonContent;
  const effectiveTo = isSliderLayout ? (sliderTo ?? to) : to;
  const designHeadingClassName =
    !size || size === "default"
      ? clsx(
          "text-[37px] leading-[1.1] md:text-[44px]",
          (!letterSpacing || letterSpacing === "normal") &&
            "tracking-[-0.02em] md:tracking-[-0.03em]",
        )
      : undefined;

  if (effectiveDisplayMode === "horizontal") {
    return (
      <div
        ref={ref}
        {...rest}
        className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center md:justify-between"
      >
        {effectiveHeadingContent && (
          <Heading
            content={effectiveHeadingContent}
            as={headingTagName}
            color={color}
            size={size}
            mobileSize={mobileSize}
            desktopSize={desktopSize}
            weight={weight}
            letterSpacing={letterSpacing}
            alignment="left"
            minSize={minSize}
            maxSize={maxSize}
            animate={animate}
            className={clsx("w-full md:flex-1", designHeadingClassName)}
          />
        )}
        {effectiveButtonContent && (
          <Link
            variant={variant}
            textColor={textColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            textColorHover={textColorHover}
            backgroundColorHover={backgroundColorHover}
            borderColorHover={borderColorHover}
            textColorDecor={textColorDecor}
            openInNewTab={openInNewTab}
            to={effectiveTo}
            className="mr-1 w-fit flex-shrink-0"
          >
            {effectiveButtonContent}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({
        contentPosition,
        gap,
      })}
    >
      {effectiveHeadingContent && (
        <Heading
          content={effectiveHeadingContent}
          as={headingTagName}
          color={color}
          size={size}
          mobileSize={mobileSize}
          desktopSize={desktopSize}
          weight={weight}
          letterSpacing={letterSpacing}
          alignment={alignment}
          minSize={minSize}
          maxSize={maxSize}
          animate={animate}
          className={designHeadingClassName}
        />
      )}
      {paragraphContent && (
        <Paragraph
          content={paragraphContent}
          as={paragraphTag}
          color={paragraphColor}
          textSize={paragraphSize}
          alignment={paragraphAlignment}
          width={paragraphWidth}
        />
      )}
      {effectiveButtonContent && (
        <Link
          variant={variant}
          textColor={textColor}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
          textColorHover={textColorHover}
          backgroundColorHover={backgroundColorHover}
          borderColorHover={borderColorHover}
          textColorDecor={textColorDecor}
          openInNewTab={openInNewTab}
          to={effectiveTo}
          className="w-fit"
        >
          {effectiveButtonContent}
        </Link>
      )}
    </div>
  );
});

export default CollectionContentDynamic;
export const schema = createSchema({
  type: "collection-content-dynamic",
  title: "Heading and link",
  limit: 1,
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "contentPosition",
          label: "Content position (Grid / Editorial)",
          helpText:
            "Card Slider automatically uses a title with a side link instead.",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "left" },
              { value: "center", label: "center" },
              { value: "right", label: "right" },
            ],
          },
        },
        {
          type: "range",
          name: "gap",
          label: "Content gap (Grid / Editorial)",
          defaultValue: 24,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Grid / editorial heading",
      inputs: [
        {
          type: "text",
          name: "headingContent",
          label: "Heading content",
          defaultValue: "EXPLORE COLLECTIONS",
          placeholder: "Enter heading text",
        },
        ...headingInputs.map((input) => {
          if ((input as any).name === "as") {
            return {
              ...input,
              name: "headingTagName",
            } as any;
          }
          return input as any;
        }),
      ],
    },
    {
      group: "Grid / editorial description",
      inputs: [
        {
          type: "richtext",
          name: "paragraphContent",
          label: "Paragraph content",
          defaultValue:
            "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
          placeholder: "Enter paragraph text",
          helpText:
            "Shown in Grid and Editorial layouts; hidden in Card Slider.",
        },
        {
          type: "select",
          name: "paragraphTag",
          label: "HTML tag",
          configs: {
            options: [
              { value: "p", label: "<p> (Paragraph)" },
              { value: "div", label: "<div> (Div)" },
            ],
          },
          defaultValue: "p",
        },
        {
          type: "color",
          name: "paragraphColor",
          label: "Text color",
        },
        {
          type: "select",
          name: "paragraphSize",
          label: "Text size",
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "toggle-group",
          name: "paragraphWidth",
          label: "Width",
          configs: {
            options: [
              { value: "full", label: "Full", icon: "move-horizontal" },
              {
                value: "narrow",
                label: "Narrow",
                icon: "fold-horizontal",
              },
            ],
          },
          defaultValue: "full",
        },
        {
          type: "toggle-group",
          name: "paragraphAlignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
        },
      ],
    },
    {
      group: "Grid / editorial link",
      inputs: [
        {
          type: "text",
          name: "buttonContent",
          label: "Button text",
          defaultValue: "EXPLORE NOW",
          placeholder: "Enter button text",
        },
        ...(linkInputs
          .map((input) => {
            if ((input as any).name === "text") {
              return null;
            }
            return input;
          })
          .filter(Boolean) as any),
      ],
    },
    {
      group: "Card slider content",
      inputs: [
        {
          type: "text",
          name: "sliderHeadingContent",
          label: "Heading",
          defaultValue: "COLLECTIONS",
          placeholder: "Enter slider heading",
        },
        {
          type: "text",
          name: "sliderButtonContent",
          label: "Link text",
          defaultValue: "VIEW ALL",
          placeholder: "Enter slider link text",
        },
        {
          type: "url",
          name: "sliderTo",
          label: "Link to",
          defaultValue: "/collections",
        },
      ],
    },
  ],
  presets: {
    displayMode: "vertical",
    contentPosition: "center",
    gap: 24,
    headingContent: "EXPLORE COLLECTIONS",
    headingTagName: "h2",
    weight: "400",
    letterSpacing: "normal",
    alignment: "center",
    paragraphContent:
      "If you're looking for products that bring ease through form and function, we offer no-fuss furniture built to last.",
    paragraphAlignment: "center",
    paragraphWidth: "narrow",
    buttonContent: "EXPLORE NOW",
    to: "/collections",
    variant: "decor",
    sliderHeadingContent: "COLLECTIONS",
    sliderButtonContent: "VIEW ALL",
    sliderTo: "/collections",
  },
});
