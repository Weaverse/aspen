import {
  CaretLeftIcon,
  CaretRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "@weaverse/hydrogen";
import { AnimatePresence, motion } from "framer-motion";
import { type Ref, useState } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";

export function MobileMenu({
  showOnDesktop = false,
}: {
  showOnDesktop?: boolean;
}) {
  const { t } = useTranslation();
  const { headerMenu } = useShopMenu();
  const [activeSubMenu, setActiveSubMenu] = useState<SingleMenuItem | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const triggerClassName = cn(
    "relative size-5 items-center justify-center focus-visible:outline-hidden before:absolute before:-inset-2",
    showOnDesktop ? "flex" : "flex xl:hidden",
  );

  if (!headerMenu) {
    return (
      <MenuTrigger
        aria-label={t("accessibility.openMenu")}
        className={triggerClassName}
        disabled
      />
    );
  }

  const menuItems = headerMenu.items as unknown as SingleMenuItem[];

  function closeMenu() {
    setActiveSubMenu(null);
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setActiveSubMenu(null);
        }
      }}
    >
      <Dialog.Trigger asChild className={triggerClassName}>
        <MenuTrigger aria-label={t("accessibility.openMenu")} />
      </Dialog.Trigger>
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
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  (event.currentTarget as HTMLElement).focus({
                    preventScroll: true,
                  });
                }}
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="fixed inset-y-0 left-0 z-10 outline-hidden"
                aria-describedby={undefined}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                  className="flex h-full w-screen max-w-[360px] flex-col overflow-hidden rounded-xl bg-[#DFDFDF] text-[#343231]"
                >
                  <MenuHeader
                    activeSubMenu={activeSubMenu}
                    onBack={() => setActiveSubMenu(null)}
                  />
                  <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait" initial={false}>
                      {activeSubMenu ? (
                        <motion.div
                          key={activeSubMenu.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SubMenu
                            item={activeSubMenu}
                            onNavigate={closeMenu}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="main-menu"
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.2 }}
                          className="px-5"
                        >
                          {menuItems.map((item) => (
                            <TopLevelMenuItem
                              key={item.id}
                              item={item}
                              onOpenSubMenu={setActiveSubMenu}
                              onNavigate={closeMenu}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
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

function MenuHeader({
  activeSubMenu,
  onBack,
}: {
  activeSubMenu: SingleMenuItem | null;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <header className="relative flex h-[74px] shrink-0 items-center px-5">
      {activeSubMenu && (
        <button
          type="button"
          onClick={onBack}
          className="relative mr-[11px] flex size-3.5 shrink-0 items-center justify-center before:absolute before:-inset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#343231]"
          aria-label={t("accessibility.backToMainMenu")}
        >
          <CaretLeftIcon aria-hidden="true" className="size-3.5" />
        </button>
      )}
      <Dialog.Title
        className={cn(
          "text-sm uppercase leading-5 tracking-[0.02em]",
          activeSubMenu ? "font-normal" : "font-semibold",
        )}
      >
        {activeSubMenu?.title || t("navigation.menu")}
      </Dialog.Title>
      <Dialog.Close asChild>
        <button
          type="button"
          className="absolute top-[31px] right-5 flex size-4 items-center justify-center before:absolute before:-inset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#343231]"
          aria-label={t("accessibility.closeMenu")}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </button>
      </Dialog.Close>
    </header>
  );
}

function TopLevelMenuItem({
  item,
  onOpenSubMenu,
  onNavigate,
}: {
  item: SingleMenuItem;
  onOpenSubMenu: (item: SingleMenuItem) => void;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  if (!item.items?.length) {
    return (
      <Link
        to={item.to}
        prefetch="intent"
        className="flex h-[54px] w-full items-center justify-start text-left text-sm uppercase leading-5"
        onClick={onNavigate}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="flex h-[54px] w-full items-center justify-between text-left text-sm uppercase leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#343231]"
      aria-label={t("accessibility.openSubmenu", { item: item.title })}
      onClick={() => onOpenSubMenu(item)}
    >
      <span>{item.title}</span>
      <CaretRightIcon aria-hidden="true" className="size-3.5" />
    </button>
  );
}

function SubMenu({
  item,
  onNavigate,
}: {
  item: SingleMenuItem;
  onNavigate: () => void;
}) {
  const items = item.items || [];
  const imageCardLayout =
    items.length > 0 &&
    items.every((subItem) => subItem.resource?.image && !subItem.items?.length);

  if (imageCardLayout) {
    return <ImageCardMenu items={items} onNavigate={onNavigate} />;
  }

  return <AccordionMenu items={items} onNavigate={onNavigate} />;
}

function ImageCardMenu({
  items,
  onNavigate,
}: {
  items: SingleMenuItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-[22px] px-5 pb-[50px]">
      {items.map((item) => {
        const previewImage = item.resource?.image;
        return (
          <Link
            to={item.to}
            key={item.id}
            className="block text-sm uppercase leading-5"
            prefetch="intent"
            onClick={onNavigate}
          >
            {previewImage && (
              <div className="aspect-[320/193.8] w-full overflow-hidden rounded-xl bg-[#F0EFED]">
                <Image
                  data={previewImage}
                  sizes="(max-width: 360px) calc(100vw - 40px), 320px"
                  width={640}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <span className="mt-5 block">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

function AccordionMenu({
  items,
  onNavigate,
}: {
  items: SingleMenuItem[];
  onNavigate: () => void;
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  return (
    <div className="px-5 pb-8">
      {items.map((item) => {
        const isOpen = openItemId === item.id;
        return (
          <AccordionMenuItem
            item={item}
            key={item.id}
            onNavigate={onNavigate}
            open={isOpen}
            onOpenChange={(nextOpen) =>
              setOpenItemId(nextOpen ? item.id : null)
            }
          />
        );
      })}
    </div>
  );
}

function AccordionMenuItem({
  item,
  onNavigate,
  open,
  onOpenChange,
}: {
  item: SingleMenuItem;
  onNavigate: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item.items?.length) {
    return (
      <div className="mt-2 border-[#D8D8D8] border-b first:mt-0">
        <Link
          to={item.to}
          prefetch="intent"
          className="flex h-[49px] items-center text-sm uppercase leading-5"
          onClick={onNavigate}
        >
          {item.title}
        </Link>
      </div>
    );
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={onOpenChange}
      className="mt-2 border-[#D8D8D8] border-b first:mt-0"
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="group flex h-[49px] w-full items-center justify-between text-left text-sm uppercase leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#343231]"
        >
          <span>{item.title}</span>
          <CaretRightIcon
            aria-hidden="true"
            className="size-4 transition-transform group-data-[state=open]:rotate-90"
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="pb-1">
        {item.items.map((child) => (
          <Link
            to={child.to}
            key={child.id}
            prefetch="intent"
            className="flex h-[34px] items-center text-sm leading-5 text-[#1E1C1A]"
            onClick={onNavigate}
          >
            {child.title}
          </Link>
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

const MenuTrigger = ({
  ref,
  ...props
}: Dialog.DialogTriggerProps & { ref?: Ref<HTMLButtonElement> }) => {
  return (
    <button ref={ref} type="button" {...props}>
      <ListIcon aria-hidden="true" className="size-5" />
    </button>
  );
};
