import * as Menubar from "@radix-ui/react-menubar";
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
  const [value, setValue] = useState<string | null>(null);
  const navigate = useNavigate();

  if (headerMenu?.items?.length) {
    const items = headerMenu.items as unknown as SingleMenuItem[];
    return (
      <Menubar.Root
        asChild
        value={value}
        onValueChange={setValue}
        onMouseLeave={() => setValue(null)}
      >
        <nav className="hidden lg:flex grow justify-center h-full desktop-menu">
          {items.map((menuItem) => {
            const { id, items = [], title, to } = menuItem;
            const level = getMaxDepth(menuItem);
            const hasSubmenu = level > 1;
            const isDropdown =
              level === 2 && items.every(({ resource }) => !resource?.image);
            return (
              <Menubar.Menu key={id} value={id}>
                <Menubar.Trigger
                  asChild={!hasSubmenu}
                  className={clsx([
                    "cursor-pointer px-3 py-2 h-full flex items-center gap-1.5",
                    'data-[state="open"]:[&>svg]:rotate-180',
                    "focus:outline-hidden uppercase",
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
                        "font-heading relative cursor-pointer",
                        "after:absolute after:left-0 after:bottom-[-2px] after:w-full after:h-[2px] after:bg-current",
                        "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
                        "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
                      )}
                    >
                      {title}
                    </span>
                  ) : (
                    <Link to={to} className="transition-none">
                      <span
                        className={cn(
                          "font-heading relative cursor-pointer",
                          "after:absolute after:left-0 after:bottom-[-2px] after:w-full after:h-[2px] after:bg-current",
                          "after:opacity-0 hover:after:opacity-100 group-data-[state=open]:after:opacity-100",
                          "after:transition-opacity after:duration-[360ms] after:ease-[cubic-bezier(0.22,1,0.36,1)]",
                        )}
                      >
                        {title}
                      </span>
                    </Link>
                  )}
                </Menubar.Trigger>
                {level > 1 && (
                  <Menubar.Content
                    className={cn([
                      "px-3 md:px-4 lg:px-6",
                      "bg-(--color-header-bg-hover) shadow-lg border-t border-line-subtle mt-1.5 lg:mt-3",
                      isDropdown ? "py-6 max-w-[300px]" : "w-screen py-8",
                    ])}
                  >
                    {isDropdown ? (
                      <DropdownSubMenu items={items} />
                    ) : (
                      <MegaMenu items={items} />
                    )}
                  </Menubar.Content>
                )}
              </Menubar.Menu>
            );
          })}
        </nav>
      </Menubar.Root>
    );
  }
  return null;
}

function DropdownSubMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <ul
      className="space-y-1.5 animate-fade-in"
      style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
    >
      {items.map(({ id, to, title }) => (
        <Link
          key={id}
          to={to}
          prefetch="intent"
          className="transition-none block"
        >
          <span className="font-normal line-clamp-2">{title}</span>
        </Link>
      ))}
    </ul>
  );
}

function MegaMenu({ items }: { items: SingleMenuItem[] }) {
  return (
    <div className="max-w-(--page-width) mx-auto flex gap-4">
      {items.map(({ id, title, to, items: children, resource }, idx) =>
        resource?.image && children.length === 0 ? (
          <SlideIn
            key={id}
            className="group/item overflow-hidden"
            style={{ "--idx": idx } as React.CSSProperties}
          >
            <Link
              to={to}
              prefetch="intent"
              className={clsx([
                "text-left",
                "font-normal uppercase",
                "flex flex-col gap-5",
              ])}
            >
              <div className="relative overflow-hidden max-w-72 w-72 aspect-square">
                <Image
                  sizes="auto"
                  data={resource.image}
                  className="w-full h-full object-cover"
                  width={300}
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover/item:opacity-20 transition-opacity duration-300"></div>
              </div>
              <span>{title}</span>
            </Link>
          </SlideIn>
        ) : (
          <SlideIn
            key={id}
            className="grow max-w-72 space-y-4"
            style={{ "--idx": idx } as React.CSSProperties}
          >
            <Link
              to={to}
              prefetch="intent"
              className="uppercase transition-none"
            >
              <span>{title}</span>
            </Link>
            <div className="flex flex-col gap-1.5">
              {children.map((cItem) => (
                <Link
                  key={cItem.id}
                  to={cItem.to}
                  prefetch="intent"
                  className="relative inline transition-none"
                >
                  <span>{cItem.title}</span>
                </Link>
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
        "opacity-0 animate-slide-left [animation-delay:calc(var(--idx)*0.1s+0.1s)]",
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
