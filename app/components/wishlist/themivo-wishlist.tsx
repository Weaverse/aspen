import { Image } from "@shopify/hydrogen";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import Link from "~/components/link";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import type { action, loader } from "~/routes/($locale).wishlist";
import { cn } from "~/utils/cn";
import { ProductCardWishlistButton } from "./product-card-wishlist-button";
import { ThemivoWishlistItems } from "./themivo-wishlist-items";

export function ThemivoWishlist({
  wishlist,
  onNavigate,
  onAdded,
  presentation,
}: {
  wishlist: Awaited<ReturnType<typeof loader>>;
  onNavigate?: (href: string) => void;
  onAdded?: () => void;
  presentation?: "drawer" | "popup" | "page";
}) {
  const t = useThemivoTranslation();
  const showItemToolbar = presentation === "popup" || presentation === "page";
  const appearance = useRouteLoaderData<RootLoader>("root")?.themivoAppearance;
  const { lists, selected, items, suggestions, nextCursor, signedIn, error } =
    wishlist;
  const path = usePrefixPathWithLocale("/wishlist");
  const login = usePrefixPathWithLocale("/account/login");
  const writable = selected && selected.role !== "viewer";
  const owner = selected?.role === "owner";
  const canCreate = signedIn && appearance?.multipleLists !== false;
  const canRename = owner && (canCreate || !selected.isDefault);
  const canShare = owner && appearance?.showShare !== false;
  const canInvite = owner && canCreate && appearance?.collaborators !== false;
  const canManage = Boolean(
    canCreate ||
      (selected && (!owner || !selected.isDefault || selected.shared)) ||
      canRename ||
      canShare ||
      canInvite,
  );
  const destinations = lists.filter(
    (list) => list.id !== selected?.id && list.role !== "viewer",
  );

  const listOptionsRef = useRef<HTMLDetailsElement>(null);
  const closeListOptions = useCallback(() => {
    const details = listOptionsRef.current;
    if (details?.open) {
      details.open = false;
      details.querySelector("summary")?.focus({ preventScroll: true });
    }
  }, []);

  const itemCount = selected?.itemCount ?? items.length;
  const listOptions = canManage && (
    <details
      ref={listOptionsRef}
      key={selected?.id ?? "new"}
      className="ms-auto max-w-full text-sm"
    >
      <summary
        className={cn(
          "cursor-pointer rounded-lg border border-line-subtle px-3 py-2 focus-visible:outline-2",
          showItemToolbar && "ms-auto w-fit",
        )}
      >
        {t(
          showItemToolbar && canShare
            ? "wishlist.share"
            : "wishlist.listOptions",
        )}
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {canCreate && (
          <ListForm intent="create" label="wishlist.create">
            <ListNameInput />
          </ListForm>
        )}
        {selected && owner && (
          <>
            {canRename && (
              <ListForm
                intent="rename"
                label="wishlist.rename"
                listId={selected.id}
              >
                <ListNameInput defaultValue={selected.name} />
              </ListForm>
            )}
            {!selected.isDefault && (
              <ListForm
                intent="delete"
                label="wishlist.delete"
                listId={selected.id}
              />
            )}
            {canShare && (
              <ListForm
                intent="share"
                label={
                  selected.shared
                    ? "wishlist.showShare"
                    : "wishlist.createShareLink"
                }
                listId={selected.id}
                shared={selected.shared}
              />
            )}
            {selected.shared && (
              <ListForm
                intent="revoke"
                label="wishlist.revoke"
                listId={selected.id}
                onSuccess={closeListOptions}
              />
            )}
            {canInvite && (
              <ListForm
                intent="invite"
                label="wishlist.invite"
                listId={selected.id}
              />
            )}
          </>
        )}
        {selected && !owner && (
          <ListForm
            intent="leave"
            label="wishlist.leave"
            listId={selected.id}
          />
        )}
      </div>
    </details>
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {!signedIn && (
        <Link
          reloadDocument
          to={`${login}?return_to=${encodeURIComponent(path)}`}
        >
          {t("wishlist.signIn")}
        </Link>
      )}
      {error ? (
        <p role="alert">{t(error)}</p>
      ) : (
        <>
          {(lists.length > 1 || (!showItemToolbar && canManage)) && (
            <div className="flex flex-wrap items-start justify-between gap-3">
              {lists.length > 1 && (
                <nav
                  aria-label={t("wishlist.lists")}
                  className="flex flex-wrap gap-4"
                >
                  {lists.map((list) => (
                    <WishlistNavigation
                      key={list.id}
                      to={`${path}?list=${encodeURIComponent(list.id)}`}
                      onNavigate={onNavigate}
                      aria-current={
                        list.id === selected?.id ? "page" : undefined
                      }
                      className="aria-[current=page]:underline"
                    >
                      {list.name}
                    </WishlistNavigation>
                  ))}
                </nav>
              )}
              {!showItemToolbar && listOptions}
            </div>
          )}
          {showItemToolbar && (
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-h-10 shrink-0 items-center text-sm">
                {t(
                  itemCount === 1
                    ? "wishlist.itemCountOne"
                    : "wishlist.itemCount",
                  {
                    count: itemCount,
                  },
                )}
              </p>
              {listOptions}
            </div>
          )}
          <ThemivoWishlistItems
            key={selected?.id}
            items={items}
            rowStyle={presentation}
            onAdded={onAdded}
            actions={
              writable && selected
                ? (item) => (
                    <>
                      <ListForm
                        intent="remove"
                        label="wishlist.removeItem"
                        rowRemove={Boolean(presentation)}
                        listId={selected.id}
                      >
                        <ItemFields
                          productId={item.productId}
                          variantId={item.variantId}
                        />
                      </ListForm>
                      {destinations.length > 0 && (
                        <ListForm
                          intent="move"
                          label="wishlist.move"
                          listId={selected.id}
                        >
                          <ItemFields
                            productId={item.productId}
                            variantId={item.variantId}
                          />
                          <select
                            name="toListId"
                            aria-label={t("wishlist.destination")}
                            className="rounded-lg border border-line-subtle p-2"
                          >
                            {destinations.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                        </ListForm>
                      )}
                    </>
                  )
                : undefined
            }
          />
          {suggestions.length > 0 && (
            <WishlistSuggestions products={suggestions} />
          )}
          {selected && nextCursor && (
            <WishlistNavigation
              to={`${path}?${new URLSearchParams({ list: selected.id, cursor: nextCursor })}`}
              onNavigate={onNavigate}
            >
              {t("wishlist.next")}
            </WishlistNavigation>
          )}
        </>
      )}
    </div>
  );
}

function ListNameInput({ defaultValue }: { defaultValue?: string }) {
  const t = useThemivoTranslation();
  return (
    <input
      className="min-w-0 rounded-lg border border-line-subtle p-2"
      name="name"
      aria-label={t("wishlist.name")}
      placeholder={t("wishlist.name")}
      defaultValue={defaultValue}
      required
      maxLength={80}
    />
  );
}

function WishlistNavigation({
  to,
  onNavigate,
  ...props
}: ComponentProps<typeof Link> & {
  to: string;
  onNavigate?: (href: string) => void;
}) {
  return (
    <Link
      {...props}
      to={to}
      onClick={(event) => {
        if (
          onNavigate &&
          event.button === 0 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        ) {
          event.preventDefault();
          onNavigate(to);
        }
      }}
    />
  );
}

function ItemFields({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string;
}) {
  return (
    <>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId} />
    </>
  );
}

function ListForm({
  intent,
  label,
  listId,
  shared,
  rowRemove,
  onSuccess,
  children,
}: {
  intent: string;
  label: string;
  listId?: string;
  shared?: boolean;
  rowRemove?: boolean;
  onSuccess?: () => void;
  children?: ReactNode;
}) {
  const t = useThemivoTranslation();
  const fetcher = useFetcher<typeof action>();
  const path = usePrefixPathWithLocale("/wishlist");
  const response = fetcher.data;
  const handledResponse = useRef<typeof response>(undefined);
  useEffect(() => {
    if (response && response !== handledResponse.current) {
      handledResponse.current = response;
      if (!("error" in response)) {
        onSuccess?.();
      }
    }
  }, [response, onSuccess]);
  const result =
    response && "listId" in response && response.listId === listId
      ? response
      : null;
  const shareToken =
    result && "shareToken" in result ? result.shareToken : undefined;
  const inviteToken =
    result && "inviteToken" in result ? result.inviteToken : undefined;
  const showShareLinks = Boolean(shareToken && shared);
  const shareLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showShareLinks && fetcher.state === "idle") {
      shareLinksRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [showShareLinks, fetcher.state]);

  return (
    <fetcher.Form
      method="post"
      action={path}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="intent" value={intent} />
      {listId && <input type="hidden" name="listId" value={listId} />}
      {children}
      <button
        type="submit"
        className={
          rowRemove
            ? "text-xs uppercase underline underline-offset-2 disabled:opacity-50"
            : "rounded-lg border border-line-subtle px-3 py-2 disabled:opacity-50"
        }
        disabled={fetcher.state !== "idle"}
      >
        {t(label)}
      </button>
      {response &&
        "error" in response &&
        typeof response.error === "string" && (
          <p role="alert">{t(response.error)}</p>
        )}
      {shareToken && showShareLinks && (
        <div
          ref={shareLinksRef}
          aria-live="polite"
          className="flex w-full flex-wrap items-center gap-3"
        >
          <WishlistShareLinks path={`${path}/shared/${shareToken}`} />
        </div>
      )}
      {inviteToken && (
        <WishlistTokenLink
          path={`${path}/join/${inviteToken}`}
          label="wishlist.inviteLink"
        />
      )}
    </fetcher.Form>
  );
}

function WishlistTokenLink({ path, label }: { path: string; label: string }) {
  const t = useThemivoTranslation();
  return (
    <a href={path} className="underline" target="_blank" rel="noreferrer">
      {t(label)}
    </a>
  );
}

const SHARE_CHANNELS = {
  facebook: {
    label: "Facebook",
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  },
  x: {
    label: "X",
    href: (url: string) => `https://x.com/intent/post?url=${url}`,
  },
  pinterest: {
    label: "Pinterest",
    href: (url: string) =>
      `https://www.pinterest.com/pin/create/button/?url=${url}`,
  },
  whatsapp: {
    label: "WhatsApp",
    href: (url: string) => `https://wa.me/?text=${url}`,
  },
  telegram: {
    label: "Telegram",
    href: (url: string) => `https://t.me/share/url?url=${url}`,
  },
  email: { label: "Email", href: (url: string) => `mailto:?body=${url}` },
};

function WishlistShareLinks({ path }: { path: string }) {
  const channels =
    useRouteLoaderData<RootLoader>("root")?.themivoAppearance?.shareChannels ??
    [];
  return (
    <>
      <WishlistTokenLink path={path} label="wishlist.shareLink" />
      {channels.map((channel) => {
        const { label, href } = SHARE_CHANNELS[channel];
        return (
          <button
            type="button"
            className="underline"
            key={channel}
            onClick={() => {
              const url = encodeURIComponent(
                new URL(path, window.location.origin).href,
              );
              window.open(href(url), "_blank", "noopener,noreferrer");
            }}
          >
            {label}
          </button>
        );
      })}
    </>
  );
}

function WishlistSuggestions({
  products,
}: {
  products: Awaited<ReturnType<typeof loader>>["suggestions"];
}) {
  const t = useThemivoTranslation();
  return (
    <section className="flex flex-col gap-3">
      <h2>{t("wishlist.suggestions")}</h2>
      <ul className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <li key={product.id} className="group/wishlist-host relative min-w-0">
            <Link
              to={`/products/${product.handle}`}
              className="flex flex-col gap-2"
            >
              {product.featuredImage && (
                <Image
                  data={product.featuredImage}
                  alt={product.featuredImage.altText ?? product.title}
                  aspectRatio="1/1"
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="w-full rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <span>{product.title}</span>
            </Link>
            <ProductCardWishlistButton
              productId={product.id}
              variantId={product.selectedOrFirstAvailableVariant?.id}
              productTitle={product.title}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
