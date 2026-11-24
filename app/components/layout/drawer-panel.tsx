import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function DrawerPanel({
  title,
  closeLabel,
  children,
}: {
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-start gap-4 px-5 pt-3 pb-6 max-xl:pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="flex h-[42px] w-full shrink-0 items-center justify-between gap-2">
        <Dialog.Title asChild className="text-sm">
          <span className="font-semibold uppercase tracking-[0.02em]">
            {title}
          </span>
        </Dialog.Title>
        <Dialog.Close
          type="button"
          className="translate-x-2 p-2"
          aria-label={closeLabel}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </Dialog.Close>
      </div>
      {children}
    </div>
  );
}
