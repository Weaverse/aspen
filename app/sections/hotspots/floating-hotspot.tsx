import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "@weaverse/hydrogen";
import {
  type ComponentProps,
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
  const openingQuickAdd = useRef(false);
  const cancelClose = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 180);
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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={markerRef}
          type="button"
          className="group flex"
          aria-label={t("product.viewProduct", {
            product: props.product?.title ?? "",
          })}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          inert={!open}
          side={props.offsetX > 50 ? "left" : "right"}
          align={props.offsetY > 50 ? "end" : "start"}
          sideOffset={8}
          collisionPadding={12}
          className="z-50 max-h-[var(--radix-popover-content-available-height)] origin-(--radix-popover-content-transform-origin) overflow-y-auto rounded-xl outline-none data-[state=closed]:pointer-events-none motion-safe:data-[state=closed]:animate-hotspot-popup-out motion-safe:data-[state=open]:animate-hotspot-popup-in"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            if (openingQuickAdd.current) {
              event.preventDefault();
              openingQuickAdd.current = false;
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
                    openingQuickAdd.current = true;
                    cancelClose();
                    setOpen(false);
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
