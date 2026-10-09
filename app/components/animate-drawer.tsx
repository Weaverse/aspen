import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  CART_DRAWER_RADIUS_CLASS,
  CART_DRAWER_WIDTH_CLASS,
} from "./cart/drawer-frame";

/**
 * `flush` pins the cart to the top/right edges. `filter` uses the same full
 * height framing, opening from the left on mobile and right on larger screens.
 * Other drawers retain their inset framing.
 */
export function AnimatedDrawer({
  open,
  children,
  flush = false,
  filter = false,
}) {
  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <Dialog.Overlay forceMount>
              <motion.div
                className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              onCloseAutoFocus={(e) => e.preventDefault()}
              className={clsx(
                "fixed z-10",
                filter
                  ? "inset-y-0 left-0 h-dvh md:right-0 md:left-auto"
                  : flush
                    ? "inset-y-0 right-0 h-dvh"
                    : "inset-y-3 right-5 max-h-[calc(100vh-36px)]",
              )}
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ x: filter ? "var(--drawer-slide-offset)" : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: filter ? "var(--drawer-slide-offset)" : "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 150,
                }}
                className={clsx(
                  "h-full overflow-hidden bg-background",
                  flush ? CART_DRAWER_WIDTH_CLASS : "w-screen max-w-[430px]",
                  flush && [CART_DRAWER_RADIUS_CLASS, "xl:bg-white"],
                  filter &&
                    "[--drawer-slide-offset:-100%] rounded-r-xl pt-3 pb-6 md:[--drawer-slide-offset:100%] md:rounded-r-none md:rounded-l-xl xl:bg-white",
                  !flush && !filter && "rounded-(--radius-md) pt-3 pb-6",
                )}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Portal>
  );
}
