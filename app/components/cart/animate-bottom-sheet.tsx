import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  CART_DRAWER_RADIUS_CLASS,
  CART_DRAWER_WIDTH_CLASS,
} from "./drawer-frame";

const BOTTOM_SHEET_TRANSITION = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1],
} satisfies Transition;

export function AnimatedBottomSheet({ open, children }) {
  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <motion.div
            className="contents"
            initial={{ "--cart-sheet-progress": 0 }}
            animate={{ "--cart-sheet-progress": 1 }}
            exit={{ "--cart-sheet-progress": 0 }}
            transition={BOTTOM_SHEET_TRANSITION}
          >
            <Dialog.Overlay forceMount>
              <div
                // The cart drawer already owns the blurred page backdrop.
                // A second animated blur repaints the cart on entry and exit.
                className={clsx(
                  "fixed inset-y-0 right-0 z-[60] bg-black/50",
                  CART_DRAWER_WIDTH_CLASS,
                )}
                style={{ opacity: "var(--cart-sheet-progress)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              onEscapeKeyDown={(event) => event.stopPropagation()}
              forceMount
              className={clsx(
                "fixed right-0 bottom-0 z-[60]",
                CART_DRAWER_WIDTH_CLASS,
              )}
              aria-describedby={undefined}
            >
              <div
                // One progress value keeps the fade and slide in the same frame.
                style={{
                  transform:
                    "translateY(calc((1 - var(--cart-sheet-progress)) * 100%))",
                }}
                className={clsx(
                  "max-h-[calc(100dvh-24px)] w-full overflow-y-auto bg-white px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl",
                  CART_DRAWER_RADIUS_CLASS,
                )}
              >
                {children}
              </div>
            </Dialog.Content>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog.Portal>
  );
}
