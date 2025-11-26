import { Content, Item, Root, Trigger } from "@radix-ui/react-dropdown-menu";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";

export function DesktopMenu() {
  const { headerMenu } = useShopMenu();
  const { openMenuBy } = useThemeSettings();
  const [value, setValue] = useState<string>("");
  const navigate = useNavigate();

  if (headerMenu?.items?.length) {
    const menuItems = headerMenu.items as unknown as SingleMenuItem[];

    return (
      <div className="hidden h-full grow justify-center lg:flex">
        {menuItems.map((menuItem) => {
          const { id, items: subItems = [], title, to } = menuItem;
          const level = getMaxDepth(menuItem);
          const hasSubmenu = level > 1;
          const isDropdown =
            level === 2 && subItems.every(({ resource }) => !resource?.image);

          // Single menu items without submenus
          if (!hasSubmenu) {
            return <SingleMenu key={id} menuItem={menuItem} />;
          }

          // Dropdown menus
          if (isDropdown) {
            return <DropdownMenu key={id} menuItem={menuItem} />;
          }

          // Mega menu items - each wrapped in its own NavigationMenu
          return (
            <NavigationMenu.Root
              key={id}
              value={value}
              onValueChange={setValue}
              className="flex h-full"
            >
              <NavigationMenu.List className="flex h-full">
                <NavigationMenu.Item
                  value={id}
                  className="flex h-full items-center"
                >
                  <NavigationMenu.Trigger
                    className={clsx([
                      "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
                      "uppercase focus:outline-hidden",
                    ])}
                    onMouseEnter={() => {
                      if (openMenuBy === "hover" && value !== id) {
                        setValue(id);
                      }
                    }}
                    onPointerDown={(e) => {
                      // Allow navigation on left click while preserving submenu behavior
                      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                        navigate(to);
                      }
                    }}
                  >
                    <NavigationMenu.Link asChild>
                      <span
                        className={cn(
                          "ff-heading relative cursor-pointer",
                          "after:absolute after:bottom-[-0.5px] after:left-0 after:h-[2px] after:w-full after:bg-[#6A4E4E]",
                          "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
                          "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
                        )}
                      >
                        {title}
                      </span>
                    </NavigationMenu.Link>
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content
                    className={cn([
                      "absolute top-0 left-0 w-screen py-8",
                      "px-3 md:px-4 lg:px-6",
                      "border-line-subtle border-t bg-(--color-header-bg-hover)",
                    ])}
                  >
                    <MegaMenu items={subItems} />
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>
              <div className="absolute inset-x-0 top-full flex w-full justify-center shadow-header">
                <NavigationMenu.Viewport
                  className={cn(
                    "relative origin-[top_center] overflow-hidden bg-(--color-header-bg-hover)",
                    'data-[state="closed"]:animate-scale-out data-[state="open"]:animate-scale-in',
                    "transition-[width,_height] duration-200",
                    "h-[var(--radix-navigation-menu-viewport-height)] w-full",
                  )}
                />
              </div>
            </NavigationMenu.Root>
          );
        })}
      </div>
    );
  }
  return null;
}

function SingleMenu({ menuItem }: { menuItem: SingleMenuItem }) {
  const { title, to } = menuItem;
  return (
    <div className="flex h-full items-center">
      <Link
        to={to}
        prefetch="intent"
        className={clsx([
          "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
          "uppercase transition-none focus:outline-hidden",
        ])}
      >
        <span
          className={cn(
            "ff-heading relative cursor-pointer",
            "after:absolute after:bottom-[-0.5px] after:left-0 after:h-[2px] after:w-full after:bg-[#6A4E4E]",
            "after:opacity-0 hover:after:opacity-100",
            "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
          )}
        >
          {title}
        </span>
      </Link>
    </div>
  );
}

function DropdownMenu({ menuItem }: { menuItem: SingleMenuItem }) {
  const [open, setOpen] = useState(false);
  const { openMenuBy } = useThemeSettings();
  const { items: childItems = [], title } = menuItem;
  return (
    <div className="h-full" onMouseLeave={() => setOpen(false)}>
      <Root open={open} onOpenChange={setOpen} modal={false}>
        <Trigger
          className={clsx([
            "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
            "uppercase focus:outline-hidden",
          ])}
          onMouseEnter={() => {
            if (openMenuBy === "hover") {
              setOpen(true);
            }
          }}
        >
          <span
            className={cn(
              "ff-heading relative cursor-pointer",
              "after:absolute after:bottom-[-0.5px] after:left-0 after:h-[2px] after:w-full after:bg-[#6A4E4E]",
              "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
              "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
            )}
          >
            {title}
          </span>
        </Trigger>
        <Content
          align="start"
          className={cn(
            "shadow-header origin-[top_center] overflow-hidden",
            "flex min-w-48 flex-col gap-1.5 border-line-subtle border-t bg-(--color-header-bg-hover)",
            "px-3 py-6 md:px-4 lg:px-6",
            'data-[state="closed"]:animate-scale-out data-[state="open"]:animate-scale-in',
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {childItems.map(({ id: itemId, to: itemTo, title: itemTitle }) => (
            <Item key={itemId} asChild>
              <Link
                to={itemTo}
                prefetch="intent"
                className="group items-center gap-2 outline-hidden transition-none"
              >
                <span>{itemTitle}</span>
              </Link>
            </Item>
          ))}
        </Content>
      </Root>
    </div>
  );
}

function MegaMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <div className="mx-auto flex max-w-(--page-width) gap-4">
      {items.map(({ id, title, to, items: children, resource }, idx) =>
        resource?.image && children.length === 0 ? (
          <SlideIn
            key={id}
            className="group/item overflow-hidden"
            style={{ "--idx": idx } as React.CSSProperties}
          >
            <NavigationMenu.Link asChild>
              <Link
                to={to}
                prefetch="intent"
                className={clsx([
                  "text-left",
                  "font-normal uppercase",
                  "flex flex-col gap-5",
                ])}
              >
                <div className="relative aspect-square w-72 max-w-72 overflow-hidden">
                  <Image
                    sizes="auto"
                    data={resource.image}
                    className="h-full w-full object-cover"
                    width={300}
                  />
                  <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover/item:opacity-20" />
                </div>
                <span>{title}</span>
              </Link>
            </NavigationMenu.Link>
          </SlideIn>
        ) : (
          <SlideIn
            key={id}
            className="max-w-72 grow space-y-4"
            style={{ "--idx": idx } as React.CSSProperties}
          >
            <NavigationMenu.Link asChild>
              <Link
                to={to}
                prefetch="intent"
                className="uppercase transition-none"
              >
                <span>{title}</span>
              </Link>
            </NavigationMenu.Link>
            <div className="flex flex-col gap-1.5">
              {children.map((cItem) => (
                <div key={cItem.id}>
                  <NavigationMenu.Link asChild>
                    <Link
                      to={cItem.to}
                      prefetch="intent"
                      className="relative inline transition-none"
                    >
                      <span>{cItem.title}</span>
                    </Link>
                  </NavigationMenu.Link>
                </div>
              ))}
            </div>
          </SlideIn>
        ),
      )}
    </div>
  );
}

function SlideIn(props: {
  className?: string;
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  const { className, children, style } = props;
  return (
    <div
      className={cn(
        "animate-slide-left opacity-0 [animation-delay:calc(var(--idx)*0.1s+0.1s)]",
        className,
      )}
      style={
        {
          "--slide-left-from": "40px",
          "--slide-left-duration": "300ms",
          ...style,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function getMaxDepth(item: { items: any[] }): number {
  if (item.items?.length > 0) {
    return Math.max(...item.items.map(getMaxDepth)) + 1;
  }
  return 1;
}
