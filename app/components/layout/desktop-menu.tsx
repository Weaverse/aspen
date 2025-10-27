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
    const items = headerMenu.items as unknown as SingleMenuItem[];
    return (
      <NavigationMenu.Root
        value={value}
        onValueChange={setValue}
        className="flex h-full justify-center"
      >
        <NavigationMenu.List className="hidden h-full grow justify-center lg:flex">
          {items.map((menuItem) => {
            const { id, items = [], title, to } = menuItem;
            const level = getMaxDepth(menuItem);
            const hasSubmenu = level > 1;
            const isDropdown =
              level === 2 && items.every(({ resource }) => !resource?.image);
            if (isDropdown) {
              return <DropdownMenu key={id} menuItem={menuItem} />;
            }
            return (
              <NavigationMenu.Item
                key={id}
                value={id}
                className="flex h-full items-center"
              >
                <NavigationMenu.Trigger
                  asChild={!hasSubmenu}
                  className={clsx([
                    "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
                    "uppercase focus:outline-hidden",
                  ])}
                  onMouseEnter={() => {
                    if (openMenuBy === "hover" && value !== id) {
                      setValue(id);
                    }
                  }}
                  onPointerDown={
                    hasSubmenu
                      ? (e) => {
                          // Allow navigation on left click while preserving submenu behavior
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                            navigate(to);
                          }
                        }
                      : undefined
                  }
                >
                  {hasSubmenu ? (
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
                  ) : (
                    <NavigationMenu.Link asChild>
                      <Link to={to} className="transition-none">
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
                      </Link>
                    </NavigationMenu.Link>
                  )}
                </NavigationMenu.Trigger>
                {level > 1 && (
                  <NavigationMenu.Content
                    className={cn([
                      "absolute top-0 left-0 w-screen py-8",
                      "px-3 md:px-4 lg:px-6",
                      "border-line-subtle border-t bg-(--color-header-bg-hover)",
                    ])}
                  >
                    <MegaMenu items={items} />
                  </NavigationMenu.Content>
                )}
              </NavigationMenu.Item>
            );
          })}
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
  }
  return null;
}

function DropdownMenu({ menuItem }: { menuItem: SingleMenuItem }) {
  const [open, setOpen] = useState(false);
  const { items: childItems = [], title, to } = menuItem;
  return (
    <div className="h-full" onMouseLeave={() => setOpen(false)}>
      <Root open={open} onOpenChange={setOpen} modal={false}>
        <Trigger
          className={clsx([
            "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
            "uppercase focus:outline-hidden",
          ])}
          onMouseEnter={() => {
            setOpen(true);
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
          // sideOffset={30}
          className={cn(
            "flex min-w-48 animate-fade-in flex-col gap-1.5 border-line-subtle border-t bg-(--color-header-bg-hover)",
            "px-3 py-6 md:px-4 lg:px-6",
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
