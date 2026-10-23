import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  CART_DRAWER_RADIUS_CLASS,
  CART_DRAWER_WIDTH_CLASS,
} from "./cart/drawer-frame";

/**
 * `flush` pins the cart to the top/right edges. `filter` uses the same full
 * height framing, opening from the right with space for the overlay on the left.
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
                filter || flush
                  ? "inset-y-0 right-0 h-dvh"
                  : "inset-y-3 right-5 max-h-[calc(100vh-36px)]",
              )}
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 150,
                }}
                className={clsx(
                  "h-full overflow-hidden bg-background",
                  flush
                    ? CART_DRAWER_WIDTH_CLASS
                    : [
                        filter
                          ? "w-[calc(100vw-var(--spacing)*8)] lg:w-[397px]"
                          : "w-screen",
                        "max-w-[430px]",
                      ],
                  flush && [CART_DRAWER_RADIUS_CLASS, "xl:bg-white"],
                  filter &&
                    "rounded-l-(--radius-md) rounded-r-none pt-3 pb-6 xl:bg-white",
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
