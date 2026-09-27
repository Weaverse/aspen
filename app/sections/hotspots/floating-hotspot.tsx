import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "@weaverse/hydrogen";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProductPopup } from "./product-popup";

export function FloatingHotspot({
  children,
  ...props
}: ComponentProps<typeof ProductPopup> & { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          side={props.offsetX > 50 ? "left" : "right"}
          align={props.offsetY > 50 ? "end" : "start"}
          sideOffset={8}
          collisionPadding={12}
          className="z-50 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <ProductPopup {...props} floating />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
