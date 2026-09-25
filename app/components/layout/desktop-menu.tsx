import { ArrowRightIcon } from "@phosphor-icons/react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useHeaderMenu } from "~/hooks/use-header-menu";
import { useLocale } from "~/hooks/use-locale";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import { navigateToMenuItem } from "~/utils/menu-navigation";

export function DesktopMenu() {
  const menuItems = useHeaderMenu();
  const { openMenuBy } = useThemeSettings();
  const locale = useLocale();
  const [value, setValue] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const followMenuItem = (menuItem: SingleMenuItem) => {
    navigateToMenuItem(menuItem, locale, {
      navigateInternal: navigate,
      navigateExternal: (to, target) => {
        if (target === "_blank") {
          window.open(to, target, "noopener,noreferrer");
        } else {
          window.location.assign(to);
        }
      },
    });
  };

  useEffect(() => {
    // Also close when a link navigates without unmounting the header.
    if (location.key) {
      setValue("");
    }
  }, [location.key]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnCompact = () => {
      if (!desktop.matches) {
        setValue("");
      }
    };
    desktop.addEventListener("change", closeOnCompact);
    return () => desktop.removeEventListener("change", closeOnCompact);
  }, []);

  if (!menuItems.length) {
    return null;
  }

  return (
    <NavigationMenu.Root
      delayDuration={100}
      skipDelayDuration={300}
      value={value}
      onValueChange={setValue}
      className="hidden h-full xl:flex"
    >
      <NavigationMenu.List className="flex h-full items-center justify-center gap-8 pt-1">
        {menuItems.map((menuItem) => {
          const { id, title, items = [] } = menuItem;
          if (!items.length) {
            return (
              <NavigationMenu.Item
                key={id}
                value={id}
                className="flex h-full items-center"
              >
                <SingleMenu menuItem={menuItem} />
              </NavigationMenu.Item>
            );
          }
          return (
            <NavigationMenu.Item
              key={id}
              value={id}
              className="flex h-full items-center"
            >
              <NavigationMenu.Trigger
                className="group flex h-full cursor-pointer items-center py-2 font-heading font-normal text-sm uppercase tracking-[-0.01em] focus-visible:outline-2 focus-visible:outline-offset-4"
                onMouseEnter={() => {
                  if (openMenuBy === "hover" && value !== id) {
                    setValue(id);
                  }
                }}
                onPointerMove={(event) => {
                  if (openMenuBy === "click") {
                    event.preventDefault();
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
                    followMenuItem(menuItem);
                  }
                }}
                onKeyDown={(event) => {
                  if (openMenuBy === "hover" && event.key === "Enter") {
                    event.preventDefault();
                    followMenuItem(menuItem);
                  }
                }}
              >
                <span className="relative after:absolute after:bottom-[-0.5px] after:left-0 after:h-[2px] after:w-full after:bg-[#6A4E4E] after:opacity-0 after:transition-opacity hover:after:opacity-100 group-data-[state=open]:after:opacity-100">
                  {title}
                </span>
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="w-full border-line-subtle border-t bg-[#DFDFDF]">
                <MegaMenu items={items} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
      <div className="absolute inset-x-0 top-full flex w-full justify-center shadow-header">
        <NavigationMenu.Viewport className="relative w-full origin-top overflow-hidden rounded-b-xl bg-[#DFDFDF] transition-[height] duration-200 data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in motion-reduce:animate-none" />
      </div>
    </NavigationMenu.Root>
  );
}

function SingleMenu({ menuItem }: { menuItem: SingleMenuItem }) {
  const { target, title, to } = menuItem;
  return (
    <div className="flex h-full items-center">
      <Link
        to={to}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
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

function ColumnsWithFeatureMenu({
  items,
  feature: selectedFeature,
  showFeature = true,
}: {
  items: SingleMenuItem[];
  feature?: SingleMenuItem;
  showFeature?: boolean;
}) {
  const feature = showFeature
    ? (selectedFeature ??
      items.find((item) => item.resource?.image && !item.items?.length))
    : undefined;
  const columns = items.filter((item) => item !== feature);
  return (
    <div
      className={cn(
        "bg-[#DFDFDF] py-16 text-[#343231]",
        showFeature ? "min-h-[414px]" : "min-h-[366px]",
      )}
    >
      <div
        className={cn(
          "mx-auto grid w-[calc(100%-4rem)] max-w-[1360px]",
          showFeature &&
            "grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-x-[clamp(24px,3vw,50px)]",
        )}
      >
        <div className="grid grid-cols-4 content-start gap-x-6 gap-y-10">
          {columns.map((item, index) => (
            <MenuLinkColumn item={item} index={index} key={item.id} />
          ))}
        </div>
        {feature?.resource?.image && (
          <EditorialImageCard item={feature} index={0} />
        )}
      </div>
    </div>
  );
}

function ColumnsMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <div className="min-h-[366px] bg-[#DFDFDF] py-16 text-[#343231]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-4 gap-x-12 gap-y-10">
        {items.map((item, index) => (
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
          target={item.target}
          rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
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
              target={child.target}
              rel={
                child.target === "_blank" ? "noopener noreferrer" : undefined
              }
              prefetch="intent"
              className="w-fit font-normal text-sm leading-none tracking-[0.02em] transition-none"
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
      className="group/editorial w-full max-w-[360px] justify-self-end"
      style={{ "--idx": index } as React.CSSProperties}
    >
      <NavigationMenu.Link asChild>
        <Link
          to={item.to}
          target={item.target}
          rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
          prefetch="intent"
          className="relative block aspect-[4/3] overflow-hidden rounded-xl"
        >
          <Image
            loading="eager"
            data={image}
            sizes="360px"
            width={720}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/editorial:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-[#171615]/20" />
          <span className="absolute inset-0 flex items-center justify-center text-center font-heading font-normal text-[#FEF4EB] text-[26px] uppercase leading-[1.1] tracking-[-0.02em]">
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
    <div className="max-h-[calc(100dvh-var(--height-nav)-4rem)] overflow-y-auto overscroll-contain bg-[#DFDFDF] py-16 text-[#343231]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-4 gap-8">
        {items.map((item, index) => {
          const image = item.resource?.image;
          if (!image) {
            return null;
          }
          return (
            <SlideIn
              key={item.id}
              className="group/article min-w-0"
              style={{ "--idx": index % 4 } as React.CSSProperties}
            >
              <NavigationMenu.Link asChild>
                <Link
                  to={item.to}
                  target={item.target}
                  rel={
                    item.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                  prefetch="intent"
                  className="block font-normal"
                >
                  <div className="aspect-video overflow-hidden rounded-xl">
                    <Image
                      loading="eager"
                      data={image}
                      sizes="316px"
                      width={632}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/article:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-4 wrap-anywhere text-[#979797] text-xs uppercase leading-none tracking-[0.02em]">
                    {item.resource?.articleTags?.[0] ||
                      item.tags?.[0] ||
                      t("navigation.article")}
                  </p>
                  <p className="mt-3 line-clamp-2 wrap-anywhere font-heading font-normal text-[26px] leading-[1.1] tracking-[-0.02em]">
                    {item.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="flex shrink-0 items-center gap-2 font-semibold text-(--color-text-subtle) text-sm leading-none tracking-[0.02em]">
                      {t("navigation.readMore")}
                      <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </span>
                  </div>
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
    <div className="max-h-[calc(100dvh-var(--height-nav)-4rem)] overflow-y-auto overscroll-contain bg-[#DFDFDF] py-16 text-[#FEF4EB]">
      <div className="mx-auto grid w-[calc(100%-4rem)] max-w-[1360px] grid-cols-4 gap-4">
        {items.map((item, index) => {
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
              style={{ "--idx": index % 4 } as React.CSSProperties}
            >
              <NavigationMenu.Link asChild>
                <Link
                  to={item.to}
                  target={item.target}
                  rel={
                    item.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                  prefetch="intent"
                  className="relative block h-[328px] overflow-hidden rounded-xl"
                >
                  <Image
                    loading="eager"
                    data={image}
                    sizes={spansTwoColumns ? "672px" : "328px"}
                    width={spansTwoColumns ? 1344 : 656}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-[1.02]"
                  />
                  <span className="absolute inset-0 bg-[#171615]/20" />
                  <span className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 text-center wrap-anywhere font-heading font-normal text-[26px] uppercase leading-[1.1] tracking-[-0.02em]">
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
  if (items.length > 0 && visualItems.length === items.length) {
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
        "animate-slide-left opacity-0 [animation-delay:calc(var(--idx)*0.1s+0.1s)] motion-reduce:animate-none motion-reduce:opacity-100",
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
