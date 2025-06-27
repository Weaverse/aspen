import type { IconProps } from "@phosphor-icons/react";
import clsx from "clsx";
import { cn } from "~/utils/cn";

const LAYOUT_ICONS = {
  1: LayoutList,
  2: TwoColumns,
  3: ThreeColumns,
};

export type LayoutSwitcherProps = {
  gridSizeDesktop: number;
  gridSizeMobile: number;
  onGridSizeChange: (number: number, context: 'mobile' | 'desktop') => void;
};

export function LayoutSwitcher({
  gridSizeDesktop,
  gridSizeMobile,
  onGridSizeChange,
  className,
}: LayoutSwitcherProps & { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-1",
        "[&>button]:text-[#b7b7b7] [&>button]:border-[#b7b7b7]",
        '[&>button[data-active="true"]]:text-[#696662]',
        '[&>button[data-active="true"]]:border-[#696662]',
        className,
      )}
    >
      {/* Mobile layout options: 1 and 2 columns */}
      {[1, 2].map((col) => {
        let Icon = LAYOUT_ICONS[col];
        return (
          <button
            key={col}
            type="button"
            data-active={gridSizeMobile === col}
            onClick={() => onGridSizeChange(col, 'mobile')}
            className="border w-12 h-12 flex lg:hidden items-center justify-center"
          >
            <Icon className="w-[22px] h-[22px]" />
          </button>
        );
      })}
      
      {/* Desktop layout options: 2 and 3 columns */}
      {[2, 3].map((col) => {
        let Icon = LAYOUT_ICONS[col];
        return (
          <button
            key={`desktop-${col}`}
            type="button"
            data-active={gridSizeDesktop === col}
            onClick={() => onGridSizeChange(col, 'desktop')}
            className="border w-12 h-12 hidden lg:flex items-center justify-center"
          >
            <Icon className="w-[22px] h-[22px]" />
          </button>
        );
      })}
    </div>
  );
}

function LayoutList(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="22" height="22" />
    </svg>
  );
}

function TwoColumns(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="10" height="22" />
      <rect x="12" width="10" height="22" />
    </svg>
  );
}

function ThreeColumns(props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="6" height="22" />
      <rect x="8" width="6" height="22" />
      <rect x="16" width="6" height="22" />
    </svg>
  );
}
