import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

/**
 * `flush` pins the cart to the top/right edges, with a rounded panel and
 * full viewport height. Other drawers keep their inset framing,
 * which the search, sort and filter drawers rely on.
 */
export function AnimatedDrawer({ open, children, flush = false }) {
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
                flush
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
                  "h-full w-screen max-w-[430px] overflow-hidden bg-background",
                  flush && "rounded-xl xl:bg-white",
                  !flush && "rounded-(--radius-md) pt-3 pb-6",
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
