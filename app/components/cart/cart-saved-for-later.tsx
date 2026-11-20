import { useEffect, useState } from "react";
import {
  useFetcher,
  useFetchers,
  useLocation,
  useRouteLoaderData,
} from "react-router";
import Link from "~/components/link";
import { ThemivoWishlistItems } from "~/components/wishlist/themivo-wishlist-items";
import { useWishlist } from "~/components/wishlist/wishlist-provider";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import type {
  action,
  loader,
} from "~/routes/($locale).api.wishlist.saved-cart";
import { THEMIVO_CART_TRANSFER_ATTRIBUTE } from "~/types/wishlist";
import { SAVED_CART_CHANGED, useCartFetcherSync } from "./cart-sync";
import type { CartLayout, CartLine } from "./cart-types";

const PATH = "/api/wishlist/saved-cart";
type SavedCartData = Awaited<ReturnType<typeof loader>>["data"];

function useSavedForLater() {
  const root = useRouteLoaderData<RootLoader>("root");
  return (
    root?.themivoAppearance?.saveForLater === true && !root.themivoScriptShop
  );
}

export function SaveCartLineForLater({ line }: { line: CartLine }) {
  const enabled = useSavedForLater();
  const { isHidden, isLoading } = useWishlist();
  if (
    !enabled ||
    isHidden(line.merchandise.product.id) ||
    ("sellingPlanAllocation" in line && line.sellingPlanAllocation) ||
    line.attributes?.some(({ key }) => key !== THEMIVO_CART_TRANSFER_ATTRIBUTE)
  ) {
    return null;
  }
  return (
    <TransferCartItem
      intent="save"
      fields={{ lineId: line.id }}
      disabled={isLoading || line.isOptimistic}
    />
  );
}

export function CartSavedForLater({
  layout = "page",
}: {
  layout?: CartLayout;
}) {
  return useSavedForLater() ? <SavedCartItems layout={layout} /> : null;
}

function SavedCartItems({ layout }: { layout: CartLayout }) {
  const t = useThemivoTranslation();
  const path = usePrefixPathWithLocale(PATH);
  const [data, setData] = useState<SavedCartData>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(SAVED_CART_CHANGED, refresh);
    return () => window.removeEventListener(SAVED_CART_CHANGED, refresh);
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Cart transfers trigger a fresh read even when the URL stays the same.
  useEffect(() => {
    const controller = new AbortController();
    // A failed optional list request must not reach the cart's route boundary.
    fetch(path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Saved cart request failed");
        }
        const result = (await response.json()) as SavedCartData;
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setData({ items: [], wishlistError: "errors.wishlistUnavailable" });
        }
      });
    return () => controller.abort();
  }, [path, revision]);

  if (!data || (!data.items.length && !("wishlistError" in data))) {
    return null;
  }

  return (
    <section className="mt-10 flex flex-col gap-6">
      <h2 className="text-xl">{t("wishlist.savedForLater")}</h2>
      {"wishlistError" in data && typeof data.wishlistError === "string" ? (
        <p role="alert">{t(data.wishlistError)}</p>
      ) : (
        <ThemivoWishlistItems
          items={data.items}
          rowStyle={layout === "drawer" ? "drawer" : undefined}
          actions={(item) => (
            <TransferCartItem
              intent="discard"
              fields={{ productId: item.productId, variantId: item.variantId }}
            />
          )}
          purchaseAction={(item) => (
            <TransferCartItem
              intent="restore"
              fields={{ productId: item.productId, variantId: item.variantId }}
              disabled={!item.merchandiseId || !item.variantId}
            />
          )}
        />
      )}
    </section>
  );
}

const TRANSFER_LABELS = {
  save: "wishlist.saveForLater",
  restore: "wishlist.moveToCart",
  discard: "wishlist.removeItem",
};

function useSavedCartTransferPending(path: string) {
  return useFetchers().some(
    (pending) => pending.formAction === path && pending.state !== "idle",
  );
}

function TransferCartItem({
  intent,
  fields,
  disabled,
}: {
  intent: "save" | "restore" | "discard";
  fields: Record<string, string>;
  disabled?: boolean;
}) {
  const t = useThemivoTranslation();
  const path = usePrefixPathWithLocale(PATH);
  const login = usePrefixPathWithLocale("/account/login");
  const location = useLocation();
  const fetcher = useFetcher<typeof action>();
  const transferPending = useSavedCartTransferPending(path);
  useCartFetcherSync(fetcher);
  const error =
    fetcher.data && "wishlistError" in fetcher.data
      ? fetcher.data.wishlistError
      : undefined;

  return (
    <fetcher.Form
      method="post"
      action={path}
      className="flex flex-col items-start gap-1"
    >
      <input type="hidden" name="intent" value={intent} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="text-sm underline disabled:opacity-50"
        disabled={disabled || transferPending || fetcher.state !== "idle"}
      >
        {t(TRANSFER_LABELS[intent])}
      </button>
      {error && (
        <p role="alert" className="text-sm">
          {t(error)}
        </p>
      )}
      {error === "wishlist.loginRequired" && (
        <Link
          reloadDocument
          to={`${login}?return_to=${encodeURIComponent(location.pathname + location.search)}`}
        >
          {t("wishlist.signIn")}
        </Link>
      )}
    </fetcher.Form>
  );
}
