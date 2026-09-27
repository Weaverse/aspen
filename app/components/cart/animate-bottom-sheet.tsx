import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

export function AnimatedBottomSheet({ open, children }) {
  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <Dialog.Overlay forceMount>
              <motion.div
                className="fixed inset-y-0 right-0 z-[60] w-screen max-w-[430px] bg-black/50 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              onEscapeKeyDown={(event) => event.stopPropagation()}
              forceMount
              className="fixed right-0 bottom-0 z-[60] w-screen max-w-[430px]"
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  duration: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="max-h-[calc(100dvh-24px)] w-full overflow-y-auto rounded-xl bg-white px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl"
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
