import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "@weaverse/hydrogen";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProductPopup } from "./product-popup";

export function FloatingHotspot({
  children,
  markerRef,
  ...props
}: ComponentProps<typeof ProductPopup> & {
  children: ReactNode;
  markerRef?: Ref<HTMLButtonElement>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetY = props.offsetY > 50 ? -16 : 16;
  const [motionStart, setMotionStart] = useState({ opacity: 0, y: offsetY });
  const [openingQuickAdd, setOpeningQuickAdd] = useState(false);
  const cancelClose = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };
  const changeOpen = (nextOpen: boolean) => {
    cancelClose();
    if (nextOpen === open) {
      return;
    }
    // Reverse interrupted motion from the visible frame, not from 0 or 1.
    const content = contentRef.current;
    if (content) {
      const style = getComputedStyle(content);
      setMotionStart({
        opacity: Number(style.opacity),
        y:
          style.transform === "none"
            ? 0
            : new DOMMatrixReadOnly(style.transform).m42,
      });
    } else {
      setMotionStart({ opacity: nextOpen ? 0 : 1, y: nextOpen ? offsetY : 0 });
    }
    setOpen(nextOpen);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => changeOpen(false), 180);
  };
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>
        <button
          ref={markerRef}
          type="button"
          className="group flex"
          aria-label={t("product.viewProduct", {
            product: props.product?.title ?? "",
          })}
          onMouseEnter={() => {
            changeOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          inert={!open}
          data-opening-quick-add={openingQuickAdd}
          side={props.offsetX > 50 ? "left" : "right"}
          align={props.offsetY > 50 ? "end" : "start"}
          sideOffset={8}
          collisionPadding={12}
          style={
            {
              "--hotspot-popup-offset-y": `${offsetY}px`,
              "--hotspot-popup-start-opacity": motionStart.opacity,
              "--hotspot-popup-start-y": `${motionStart.y}px`,
            } as CSSProperties
          }
          className="z-50 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl outline-none data-[state=closed]:pointer-events-none motion-safe:data-[state=open]:animate-hotspot-popup-in motion-safe:data-[state=closed]:data-[opening-quick-add=false]:animate-hotspot-popup-out"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            if (openingQuickAdd) {
              event.preventDefault();
              setOpeningQuickAdd(false);
            }
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <ProductPopup
            {...props}
            floating
            onQuickAdd={
              props.onQuickAdd
                ? (selectedOptions) => {
                    setOpeningQuickAdd(true);
                    changeOpen(false);
                    props.onQuickAdd?.(selectedOptions);
                  }
                : undefined
            }
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
