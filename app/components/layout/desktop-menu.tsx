import { ArrowRightIcon } from "@phosphor-icons/react";
import { Content, Item, Root, Trigger } from "@radix-ui/react-dropdown-menu";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { RootLoader } from "~/root";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import { prefixPathWithLocale } from "~/utils/locale";

export function DesktopMenu() {
  const { headerMenu } = useShopMenu();
  const { openMenuBy } = useThemeSettings();
  const [value, setValue] = useState<string>("");
  const navigate = useNavigate();
  const selectedLocale = useRouteLoaderData<RootLoader>("root")?.selectedLocale;
  const navigateWithLocale = (to: string) => {
    navigate(selectedLocale ? prefixPathWithLocale(to, selectedLocale) : to);
  };

  if (headerMenu?.items?.length) {
    const menuItems = headerMenu.items as unknown as SingleMenuItem[];

    return (
      <div className="hidden h-full items-center justify-center gap-8 pt-1 xl:flex">
        {menuItems.map((menuItem) => {
          const { id, items: subItems = [], title, to } = menuItem;
          const level = getMaxDepth(menuItem);
          const hasSubmenu = level > 1;
          const hasVisualItems =
            subItems.length > 0 &&
            subItems.every(
              (item) => item.resource?.image && !item.items?.length,
            );
          const isDropdown = level === 2 && !hasVisualItems;

          // Single menu items without submenus
          if (!hasSubmenu) {
            return <SingleMenu key={id} menuItem={menuItem} />;
          }

          // Dropdown menus
          if (isDropdown) {
            return (
              <DropdownMenu
                key={id}
                menuItem={menuItem}
                onNavigate={navigateWithLocale}
              />
            );
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
                      "flex h-full cursor-pointer items-center py-2",
                      "font-heading font-normal text-sm uppercase tracking-[-0.01em] focus:outline-hidden",
                    ])}
                    onMouseEnter={() => {
                      if (openMenuBy === "hover" && value !== id) {
                        setValue(id);
                      }
                    }}
                    onPointerDown={(event) => {
                      if (
                        openMenuBy === "hover" &&
                        event.button === 0 &&
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.shiftKey
                      ) {
                        navigateWithLocale(to);
                      }
                    }}
                  >
                    <NavigationMenu.Link asChild>
                      <span
                        className={cn(
                          "relative cursor-pointer",
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
                      "absolute top-0 left-0 w-screen",
                      "border-line-subtle border-t bg-[#DFDFDF]",
                    ])}
                  >
                    <MegaMenu items={subItems} />
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>
              <div className="absolute inset-x-0 top-full flex w-full justify-center shadow-header">
                <NavigationMenu.Viewport
                  className={cn(
                    "relative origin-[top_center] overflow-hidden rounded-b-xl bg-[#DFDFDF]",
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
          "flex h-full cursor-pointer items-center py-2",
          "font-heading font-normal text-sm uppercase tracking-[-0.01em] transition-none focus:outline-hidden",
        ])}
      >
        <span
          className={cn(
            "relative cursor-pointer",
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

function DropdownMenu({
  menuItem,
  onNavigate,
}: {
  menuItem: SingleMenuItem;
  onNavigate: (to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { openMenuBy } = useThemeSettings();
  const { isExternal, items: childItems = [], title, to, type, url } = menuItem;
  const isExternalMenuGroup =
    type === "HTTP" ||
    isExternal ||
    url?.startsWith("http://") ||
    url?.startsWith("https://") ||
    to.startsWith("http://") ||
    to.startsWith("https://");
  const triggerClassName = clsx([
    "flex h-full cursor-pointer items-center py-2",
    "font-heading font-normal text-sm uppercase tracking-[-0.01em] focus:outline-hidden",
  ]);
  const triggerLabel = (
    <span
      className={cn(
        "relative cursor-pointer",
        "after:absolute after:bottom-[-0.5px] after:left-0 after:h-[2px] after:w-full after:bg-[#6A4E4E]",
        "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
        "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
    >
      {title}
    </span>
  );
  return (
    <div className="h-full" onMouseLeave={() => setOpen(false)}>
      <Root open={open} onOpenChange={setOpen} modal={false}>
        <Trigger
          className={triggerClassName}
          onMouseEnter={() => {
            if (isExternalMenuGroup) {
              setOpen(true);
              return;
            }
            if (openMenuBy === "hover") {
              setOpen(true);
            }
          }}
          onPointerDown={(event) => {
            if (isExternalMenuGroup) {
              if (
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey
              ) {
                event.preventDefault();
                setOpen(true);
              }
              return;
            }
            if (
              openMenuBy === "hover" &&
              event.button === 0 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey
            ) {
              setOpen(false);
              onNavigate(to);
            }
          }}
          onKeyDown={(event) => {
            if (isExternalMenuGroup) {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
              }
              return;
            }
            if (openMenuBy === "hover" && event.key === "Enter") {
              event.preventDefault();
              setOpen(false);
              onNavigate(to);
            }
          }}
        >
          {triggerLabel}
        </Trigger>
        <Content
          align="start"
          className={cn(
            "origin-[top_center] overflow-hidden shadow-header",
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
  const layout = getMegaMenuLayout(items);

  switch (layout) {
    case "articles":
      return <ArticleCardsMenu items={items} />;
    case "image-tiles":
      return <ImageTilesMenu items={items} />;
    case "columns-with-feature":
      return <ColumnsWithFeatureMenu items={items} />;
    default:
      return <ColumnsMenu items={items} />;
  }
}

function ColumnsWithFeatureMenu({ items }: { items: SingleMenuItem[] }) {
  const columns = items.filter((item) => item.items?.length);
  const feature = items.find(
    (item) => item.resource?.image && !item.items?.length,
  );

  return (
    <div className="h-[414px] bg-[#DFDFDF] pt-16 text-[#343231]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-[200px_200px_200px_200px_1fr] gap-x-10">
        {columns.slice(0, 4).map((item, index) => (
          <MenuLinkColumn item={item} index={index} key={item.id} />
        ))}
        {feature?.resource?.image && (
          <EditorialImageCard item={feature} index={columns.length} />
        )}
      </div>
    </div>
  );
}

function ColumnsMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <div className="h-[366px] bg-[#DFDFDF] pt-16 text-[#343231]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-[repeat(4,200px)] gap-x-10">
        {items.slice(0, 4).map((item, index) => (
          <MenuLinkColumn item={item} index={index} key={item.id} />
        ))}
      </div>
    </div>
  );
}

function MenuLinkColumn({
  item,
  index,
}: {
  item: SingleMenuItem;
  index: number;
}) {
  return (
    <SlideIn style={{ "--idx": index } as React.CSSProperties}>
      <NavigationMenu.Link asChild>
        <Link
          to={item.to}
          prefetch="intent"
          className="inline-block font-semibold text-sm uppercase leading-none tracking-[0.02em] transition-none"
        >
          {item.title}
        </Link>
      </NavigationMenu.Link>
      <div className="mt-6 flex flex-col gap-5">
        {item.items?.map((child) => (
          <NavigationMenu.Link asChild key={child.id}>
            <Link
              to={child.to}
              prefetch="intent"
              className="w-fit text-sm leading-none tracking-[0.02em] transition-none"
            >
              {child.title}
            </Link>
          </NavigationMenu.Link>
        ))}
      </div>
    </SlideIn>
  );
}

function EditorialImageCard({
  item,
  index,
}: {
  item: SingleMenuItem;
  index: number;
}) {
  const image = item.resource?.image;
  if (!image) {
    return null;
  }

  return (
    <SlideIn
      className="group/editorial w-[360px] justify-self-end"
      style={{ "--idx": index } as React.CSSProperties}
    >
      <NavigationMenu.Link asChild>
        <Link
          to={item.to}
          prefetch="intent"
          className="relative block h-[270px] overflow-hidden rounded-xl"
        >
          <Image
            data={image}
            sizes="360px"
            width={720}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/editorial:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-[#171615]/20" />
          <span className="absolute inset-0 flex items-center justify-center text-center font-heading text-[26px] text-white uppercase leading-[1.1] tracking-[-0.02em]">
            {item.title}
          </span>
        </Link>
      </NavigationMenu.Link>
    </SlideIn>
  );
}

function ArticleCardsMenu({ items }: { items: SingleMenuItem[] }) {
  const { t } = useTranslation();
  return (
    <div className="h-[448px] bg-[#DFDFDF] pt-16 text-[#343231]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-4 gap-8">
        {items.slice(0, 4).map((item, index) => {
          const image = item.resource?.image;
          if (!image) {
            return null;
          }
          return (
            <SlideIn
              key={item.id}
              className="group/article min-w-0"
              style={{ "--idx": index } as React.CSSProperties}
            >
              <NavigationMenu.Link asChild>
                <Link to={item.to} prefetch="intent" className="block">
                  <div className="h-[177.75px] overflow-hidden rounded-xl">
                    <Image
                      data={image}
                      sizes="316px"
                      width={632}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/article:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-3 text-[#9D9D9D] text-xs uppercase leading-none tracking-[0.02em]">
                    {item.resource?.articleTags?.[0] ||
                      item.tags?.[0] ||
                      t("navigation.article")}
                  </p>
                  <p className="mt-2.5 line-clamp-2 font-heading text-[26px] leading-[1.1] tracking-[-0.02em]">
                    {item.title}
                  </p>
                  <span className="mt-3.5 flex items-center gap-2 font-semibold text-sm leading-none tracking-[0.02em]">
                    {t("navigation.readMore")}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </NavigationMenu.Link>
            </SlideIn>
          );
        })}
      </div>
    </div>
  );
}

function ImageTilesMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <div className="h-[472px] bg-[#DFDFDF] pt-16 text-white">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-4 gap-4">
        {items.slice(0, 4).map((item, index) => {
          const image = item.resource?.image;
          if (!image) {
            return null;
          }
          const spansTwoColumns =
            (items.length === 2 && index < 2) ||
            (items.length === 3 && index === 2);
          return (
            <SlideIn
              key={item.id}
              className={cn(
                "group/tile min-w-0",
                spansTwoColumns && "col-span-2",
              )}
              style={{ "--idx": index } as React.CSSProperties}
            >
              <NavigationMenu.Link asChild>
                <Link
                  to={item.to}
                  prefetch="intent"
                  className="relative block h-[328px] overflow-hidden rounded-xl"
                >
                  <Image
                    data={image}
                    sizes={spansTwoColumns ? "672px" : "328px"}
                    width={spansTwoColumns ? 1344 : 656}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-[1.02]"
                  />
                  <span className="absolute inset-0 bg-[#171615]/20" />
                  <span className="absolute inset-0 flex items-center justify-center text-center font-heading text-[26px] uppercase leading-[1.1] tracking-[-0.02em]">
                    {item.title}
                  </span>
                </Link>
              </NavigationMenu.Link>
            </SlideIn>
          );
        })}
      </div>
    </div>
  );
}

type MegaMenuLayout =
  | "articles"
  | "image-tiles"
  | "columns-with-feature"
  | "columns";

function getMegaMenuLayout(items: SingleMenuItem[]): MegaMenuLayout {
  const visualItems = items.filter(
    (item) => item.resource?.image && !item.items?.length,
  );
  const columnItems = items.filter((item) => item.items?.length);
  const allArticles =
    items.length > 0 &&
    items.every(
      (item) =>
        item.resource?.__typename === "Article" || item.to.includes("/blogs/"),
    );

  if (allArticles && visualItems.length === items.length) {
    return "articles";
  }
  if (visualItems.length === items.length) {
    return "image-tiles";
  }
  if (columnItems.length > 0 && visualItems.length > 0) {
    return "columns-with-feature";
  }
  return "columns";
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
