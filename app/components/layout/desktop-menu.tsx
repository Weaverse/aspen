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
        <nav className="desktop-menu hidden h-full grow justify-center lg:flex">
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
                    "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
                    'data-[state="open"]:[&>svg]:rotate-180',
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
                  )}
                </Menubar.Trigger>
                {level > 1 && (
                  <Menubar.Content
                    className={cn([
                      "px-3 md:px-4 lg:px-6",
                      "mt-1.5 border-line-subtle border-t bg-(--color-header-bg-hover) lg:mt-3",
                      isDropdown ? "max-w-[300px] py-6" : "w-screen py-8",
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
      className="animate-fade-in space-y-1.5"
      style={{ "--fade-in-duration": "150ms" } as React.CSSProperties}
    >
      {items.map(({ id, to, title }) => (
        <Link
          key={id}
          to={to}
          prefetch="intent"
          className="block transition-none"
        >
          <span className="line-clamp-2 font-normal">{title}</span>
        </Link>
      ))}
    </ul>
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
          </SlideIn>
        ) : (
          <SlideIn
            key={id}
            className="max-w-72 grow space-y-4"
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
