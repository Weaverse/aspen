import {
  CaretLeftIcon,
  CaretRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import { forwardRef, useState } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";

export function MobileMenu() {
  const { headerMenu } = useShopMenu();
  const [activeSubMenu, setActiveSubMenu] = useState<SingleMenuItem | null>(
    null,
  );
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!headerMenu) return <MenuTrigger />;

  const closeSubMenu = () => setActiveSubMenu(null);
  const closeAllMenus = () => {
    setActiveSubMenu(null);
    setMainMenuOpen(false);
  };

  const handleMainOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsAnimating(false);
      setMainMenuOpen(true);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setMainMenuOpen(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <Dialog.Root open={mainMenuOpen} onOpenChange={handleMainOpenChange}>
      <Dialog.Trigger
        asChild
        className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-hidden lg:hidden"
      >
        <MenuTrigger />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn([
            "fixed inset-0 z-10 bg-black/50 transition-opacity duration-300",
            mainMenuOpen && !isAnimating ? "opacity-100" : "opacity-0",
          ])}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-0 left-0 z-10 h-screen bg-(--color-header-bg-hover) pt-4 pb-2",
            "transition-transform duration-300 ease-in-out",
            "data-[state=open]:animate-enter-from-left",
            mainMenuOpen && !isAnimating
              ? "translate-x-0"
              : "-translate-x-full",
            "focus-visible:outline-hidden",
            "uppercase",
          ])}
          aria-describedby={undefined}
        >
          <Dialog.Title asChild>
            <div className="px-4 font-semibold uppercase">Menu</div>
          </Dialog.Title>
          <Dialog.Close asChild>
            <XIcon className="fixed top-4 right-4 h-5 w-5" />
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
        </Dialog.Content>
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
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsAnimating(false);
      setOpen(true);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
        onClose();
      }, 300);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn([
            "fixed inset-0 z-20 bg-black/50 transition-opacity duration-300",
            open && !isAnimating ? "opacity-100" : "opacity-0",
          ])}
        />
        <Dialog.Content
          className={cn([
            "fixed inset-0 left-0 z-20 h-screen bg-(--color-header-bg-hover) pt-4 pb-2",
            "transition-transform duration-300 ease-in-out",
            open && !isAnimating ? "translate-x-0" : "-translate-x-full",
            "focus-visible:outline-hidden",
            "uppercase",
          ])}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center"
              >
                <CaretLeftIcon className="h-5 w-5" />
              </button>
              <Dialog.Title asChild>
                <div className="font-semibold uppercase">{item.title}</div>
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
        </Dialog.Content>
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
        {items.map((item) => (
          <CollapsibleMenuItem key={item.id} item={item} onClose={onClose} />
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
