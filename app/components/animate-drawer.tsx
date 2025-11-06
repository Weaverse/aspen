import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

export function AnimatedDrawer({ open, children }) {
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
              className="fixed inset-y-0 right-0 z-10"
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
                className="h-full w-screen max-w-[430px] bg-background py-4"
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
