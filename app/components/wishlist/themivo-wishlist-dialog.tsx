import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { AnimatedDrawer } from "~/components/animate-drawer";
import { useCartStore } from "~/components/cart/store";
import { DrawerPanel } from "~/components/layout/drawer-panel";
import { QuickShopFade } from "~/components/product/quick-shop-fade";
import {
  QUICK_SHOP_DESKTOP_FRAME_CLASS,
  QUICK_SHOP_DESKTOP_SURFACE_CLASS,
  QUICK_SHOP_MOBILE_FRAME_CLASS,
  QUICK_SHOP_MOBILE_SURFACE_CLASS,
  QUICK_SHOP_OVERLAY_CLASS,
  useQuickShopMobile,
} from "~/components/product/quick-shop-frame";
import { ScrollArea } from "~/components/scroll-area";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useQuickViewScrollbar } from "~/hooks/use-quick-view-scrollbar";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { loader } from "~/routes/($locale).wishlist";
import { cn } from "~/utils/cn";
import { ThemivoWishlist } from "./themivo-wishlist";

export function ThemivoWishlistDialog({
  mode,
  label,
  triggerClassName,
  children,
}: {
  mode: "drawer" | "popup";
  label: string;
  triggerClassName: string;
  children: ReactNode;
}) {
  const t = useThemivoTranslation();
  const [open, setOpen] = useState(false);
  const openCartAfterExit = useRef(false);
  const closeLabel = t(
    "wishlist.dialogClose",
    undefined,
    "accessibility.close",
  );

  useQuickViewScrollbar(mode === "popup" && open);

  function openCart() {
    openCartAfterExit.current = true;
    setOpen(false);
  }

  function handleExit() {
    if (!open && openCartAfterExit.current) {
      openCartAfterExit.current = false;
      useCartStore.getState().open();
    }
  }

  function handleCloseFocus(event: Event) {
    if (openCartAfterExit.current || useCartStore.getState().isOpen) {
      event.preventDefault();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger aria-label={label} className={triggerClassName}>
        {children}
      </Dialog.Trigger>
      {mode === "drawer" ? (
        <AnimatedDrawer
          open={open}
          flush
          onCloseAutoFocus={handleCloseFocus}
          onExitComplete={handleExit}
        >
          <DrawerPanel title={t("wishlist.title")} closeLabel={closeLabel}>
            <WishlistDialogContent drawer onAdded={openCart} />
          </DrawerPanel>
        </AnimatedDrawer>
      ) : (
        <WishlistPopup
          open={open}
          title={t("wishlist.title")}
          closeLabel={closeLabel}
          onCloseAutoFocus={handleCloseFocus}
          onExitComplete={handleExit}
        >
          <WishlistDialogContent onAdded={openCart} />
        </WishlistPopup>
      )}
    </Dialog.Root>
  );
}

function WishlistPopup({
  open,
  title,
  closeLabel,
  children,
  onCloseAutoFocus,
  onExitComplete,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  children: ReactNode;
  onCloseAutoFocus: (event: Event) => void;
  onExitComplete: () => void;
}) {
  const mobile = useQuickShopMobile();
  const content = (
    <>
      <Dialog.Title className="mb-4 pe-7 text-lg font-semibold">
        {title}
      </Dialog.Title>
      {children}
    </>
  );

  return (
    <Dialog.Portal forceMount>
      <AnimatePresence onExitComplete={onExitComplete}>
        {open && (
          <>
            <Dialog.Overlay forceMount>
              <QuickShopFade className={QUICK_SHOP_OVERLAY_CLASS} />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              aria-describedby={undefined}
              data-wishlist-mode="popup"
              className={cn(
                "fixed z-10",
                mobile
                  ? QUICK_SHOP_MOBILE_FRAME_CLASS
                  : QUICK_SHOP_DESKTOP_FRAME_CLASS,
              )}
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <QuickShopFade
                className={
                  mobile
                    ? QUICK_SHOP_MOBILE_SURFACE_CLASS
                    : QUICK_SHOP_DESKTOP_SURFACE_CLASS
                }
              >
                <div
                  className={
                    mobile ? "relative flex h-full flex-col" : undefined
                  }
                >
                  <Dialog.Close
                    type="button"
                    aria-label={closeLabel}
                    className={cn(
                      "absolute top-4 flex size-5 items-center justify-center",
                      mobile ? "right-5 z-30" : "right-4 z-10",
                    )}
                  >
                    <XIcon aria-hidden="true" className="size-5" />
                  </Dialog.Close>
                  {mobile ? (
                    <ScrollArea rootClassName="min-h-0 flex-1" size="sm">
                      <div className="px-5 pt-10 pb-8">{content}</div>
                    </ScrollArea>
                  ) : (
                    content
                  )}
                </div>
              </QuickShopFade>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Portal>
  );
}

function WishlistDialogContent({
  onAdded,
  drawer = false,
}: {
  onAdded: () => void;
  drawer?: boolean;
}) {
  const t = useThemivoTranslation();
  const path = usePrefixPathWithLocale("/wishlist");
  const { data, load, state } = useFetcher<typeof loader>();
  useEffect(() => {
    load(path);
  }, [load, path]);

  return (
    <div
      className={cn(
        "min-h-0 overflow-y-auto overscroll-contain",
        drawer && "hidden-scroll w-full flex-1 pb-4",
      )}
      aria-busy={state !== "idle"}
    >
      {data ? (
        <ThemivoWishlist
          wishlist={data}
          onNavigate={load}
          onAdded={onAdded}
          presentation={drawer ? "drawer" : "popup"}
        />
      ) : (
        <p role="status">
          {t("wishlist.dialogLoading", undefined, "system.loading")}
        </p>
      )}
    </div>
  );
}
