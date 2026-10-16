import { Image } from "@shopify/hydrogen";
import type { ComponentProps } from "react";
import { cn } from "~/utils/cn";
import { isLightColor, isValidColor } from "~/utils/misc";

export type SwatchSize = "large" | "small";

// Large follows Main Product; small follows Product Card.
const sizes = {
  large: { padding: "p-1", fill: "size-5", pixels: 20 },
  small: { padding: "p-0.5", fill: "size-3", pixels: 12 },
};

export function swatchFrameClassName(size: SwatchSize, selected = false) {
  return cn(
    "flex size-auto shrink-0 items-start justify-start gap-2.5 rounded-(--radius-xs) bg-background transition-colors",
    sizes[size].padding,
    selected ? "border border-line" : "border-[0.5px] border-line-subtle",
  );
}

export function SwatchFill({
  size,
  color = "",
  image,
}: {
  size: SwatchSize;
  color?: string;
  image?: ComponentProps<typeof Image>["data"];
}) {
  const { fill, pixels } = sizes[size];
  const className = cn(
    "block aspect-square shrink-0 rounded-(--radius-xs)",
    fill,
  );

  if (image?.url) {
    return (
      <Image
        data={image}
        alt=""
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        className={cn(className, "object-cover object-center")}
      />
    );
  }

  const valid = isValidColor(color);
  return (
    <span
      aria-hidden="true"
      className={cn(
        className,
        // Preserve the compact Product Card treatment for very light colors.
        size === "small" &&
          (!valid || isLightColor(color)) &&
          "border border-line-subtle",
      )}
      style={{
        backgroundColor: valid ? color : "var(--color-line-subtle)",
      }}
    />
  );
}

export function SwatchPreview({
  selected = false,
  ...props
}: ComponentProps<typeof SwatchFill> & { selected?: boolean }) {
  return (
    <span className={swatchFrameClassName(props.size, selected)}>
      <SwatchFill {...props} />
    </span>
  );
}
