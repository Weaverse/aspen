import {
  CaretLeftIcon,
  CaretRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useState } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";

export function MobileMenu() {
  const { headerMenu } = useShopMenu();
  const [activeSubMenu, setActiveSubMenu] = useState<SingleMenuItem | null>(
    null,
  );
  const [mainMenuOpen, setMainMenuOpen] = useState(false);

  if (!headerMenu) return <MenuTrigger />;

  const closeSubMenu = () => setActiveSubMenu(null);
  const closeAllMenus = () => {
    setActiveSubMenu(null);
    setMainMenuOpen(false);
  };

  return (
    <Dialog.Root open={mainMenuOpen} onOpenChange={setMainMenuOpen}>
      <Dialog.Trigger
        asChild
        className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-hidden lg:hidden"
      >
        <MenuTrigger />
      </Dialog.Trigger>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {mainMenuOpen && (
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
                className="fixed inset-y-0 left-0 z-10"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "-100vw" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100vw" }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 150,
                  }}
                  className="h-full w-[360px] bg-(--color-header-bg-hover) pt-4 pb-2 uppercase"
                >
                  <Dialog.Title asChild>
                    <div className="px-4 font-semibold uppercase">Menu</div>
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" className="fixed top-4 right-4">
                      <XIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                  <div className="mt-4 border-line-subtle border-t" />
                  <div className="py-2">
                    <ScrollArea className="h-[calc(100vh-5rem)]">
                      <div className="flex w-full flex-col gap-1 px-4">
                        {headerMenu.items.map((item) => (
                          <TopLevelMenuItem
                            key={item.id}
                            item={item as unknown as SingleMenuItem}
                            onOpenSubMenu={setActiveSubMenu}
                            onCloseAll={closeAllMenus}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>

      {/* SubMenu Dialog */}
      {activeSubMenu && (
        <SubMenuDialog
          item={activeSubMenu}
          onClose={closeSubMenu}
          onCloseAll={closeAllMenus}
        />
      )}
    </Dialog.Root>
  );
}

// Component for top-level menu items (level 1)
function TopLevelMenuItem({
  item,
  onOpenSubMenu,
  onCloseAll,
}: {
  item: SingleMenuItem;
  onOpenSubMenu: (item: SingleMenuItem) => void;
  onCloseAll: () => void;
}) {
  const { title, to, items } = item;

  if (!items?.length) {
    return (
      <Link to={to} className="py-3" onClick={onCloseAll}>
        {title}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 py-3"
      onClick={() => onOpenSubMenu(item)}
    >
      <span className="uppercase">{title}</span>
      <CaretRightIcon className="h-4 w-4" />
    </button>
  );
}

// SubMenu Dialog Component
function SubMenuDialog({
  item,
  onClose,
  onCloseAll,
}: {
  item: SingleMenuItem;
  onClose: () => void;
  onCloseAll: () => void;
}) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal forceMount>
        <AnimatePresence onExitComplete={onClose}>
          {open && (
            <>
              <Dialog.Overlay forceMount>
                <motion.div
                  className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="fixed inset-y-0 left-0 z-20"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "-100vw" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100vw" }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 150,
                  }}
                  className="h-full w-[360px] bg-(--color-header-bg-hover) pt-4 pb-2 uppercase"
                >
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-6 w-6 items-center justify-center"
                      >
                        <CaretLeftIcon className="h-5 w-5" />
                      </button>
                      <Dialog.Title asChild>
                        <div className="font-semibold uppercase">
                          {item.title}
                        </div>
                      </Dialog.Title>
                    </div>
                    <button
                      type="button"
                      onClick={onCloseAll}
                      className="flex h-6 w-6 items-center justify-center"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-4 border-line-subtle border-t" />
                  <div className="py-2">
                    <ScrollArea className="h-[calc(100vh-5rem)]">
                      <div className="flex w-full flex-col gap-1 px-4">
                        {item.items?.map((subItem) => (
                          <CollapsibleMenuItem
                            key={subItem.id}
                            item={subItem}
                            onClose={onCloseAll}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Component for sub-menu items (level 2+) - uses collapsible
function CollapsibleMenuItem({
  item,
  onClose,
}: {
  item: SingleMenuItem;
  onClose?: () => void;
}) {
  const { title, to, items } = item;
  const previewImage = item.resource?.image;

  if (!items?.length) {
    return (
      <Link to={to} className="block w-full py-3" onClick={onClose}>
        <span className="flex w-full flex-col items-start gap-2">
          {previewImage && (
            <div className="aspect-[16/9] w-full overflow-hidden">
              <Image
                data={previewImage as any}
                sizes="100vw"
                width={1200}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <span className="uppercase">{title}</span>
        </span>
      </Link>
    );
  }

  return (
    <Collapsible.Root>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className='flex w-full flex-col items-stretch gap-2 py-3 data-[state="open"]:[&_.caret]:rotate-90'
        >
          {previewImage && (
            <div className="aspect-[16/9] w-full overflow-hidden">
              <Image
                data={previewImage as any}
                sizes="100vw"
                width={1200}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="uppercase">{title}</span>
            <CaretRightIcon className="caret h-4 w-4" />
          </div>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="pl-4">
        {items.map((subItem) => (
          <CollapsibleMenuItem
            key={subItem.id}
            item={subItem}
            onClose={onClose}
          />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

const MenuTrigger = forwardRef<HTMLButtonElement, Dialog.DialogTriggerProps>(
  (props, ref) => {
    return (
      <button ref={ref} type="button" {...props}>
        <ListIcon className="h-5 w-5" />
      </button>
    );
  },
);
