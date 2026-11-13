import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFetcher, useLocation, useRouteLoaderData } from "react-router";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useThemivoTranslation } from "~/hooks/use-themivo-translation";
import type { RootLoader } from "~/root";
import type { WishlistApiResponse } from "~/types/wishlist";
import { cn } from "~/utils/cn";

type WishlistContextValue = {
  authenticated: boolean;
  error?: string;
  isLoading: boolean;
  isUpdating: (productId: string, variantId?: string) => boolean;
  isWishlisted: (productId: string, variantId?: string) => boolean;
  setupRequired: boolean;
  themivo: boolean;
  count: number;
  isHidden: (productId: string) => boolean;
  toggle: (productId: string, variantId?: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  initialWishlist,
}: {
  children: React.ReactNode;
  initialWishlist: Promise<WishlistApiResponse> | WishlistApiResponse;
}) {
  const t = useThemivoTranslation();
  const root = useRouteLoaderData<RootLoader>("root");
  const guestEnabled = root?.themivoAppearance?.guestWishlist !== false;
  const toastPosition = root?.themivoScriptShop
    ? null
    : root?.themivoAppearance?.toastPosition;
  const [toast, setToast] = useState<{ saved: boolean }>();
  const apiPath = usePrefixPathWithLocale("/api/wishlist");
  const loginPath = usePrefixPathWithLocale("/account/login");
  const fetcher = useFetcher<WishlistApiResponse>({ key: "account-wishlist" });
  const location = useLocation();
  const pendingProductId = useRef<string | null>(null);
  const previousProductIds = useRef<Set<string> | null>(null);
  const lastResponse = useRef<WishlistApiResponse | undefined>(undefined);
  const [acceptsGuests, setAcceptsGuests] = useState(false);
  const themivo = root?.usesThemivo === true;
  const [hiddenProductIds, setHiddenProductIds] = useState<Set<string> | null>(
    null,
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [productIds, setProductIds] = useState<Set<string>>(() => new Set());
  const [savedVariantIds, setSavedVariantIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [savedProductCount, setSavedProductCount] = useState<number>();
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string>();
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    let active = true;

    setHasLoaded(false);
    Promise.resolve(initialWishlist)
      .then((wishlist) => {
        if (!active) {
          return;
        }

        setAcceptsGuests(Boolean(wishlist.acceptsGuests));
        if (!wishlist.error || !wishlist.themivo) {
          setAuthenticated(wishlist.authenticated);
          setProductIds(new Set(wishlist.productIds));
          setSavedProductCount(wishlist.savedProductCount);
          setSavedVariantIds(new Set(wishlist.savedVariantIds));
        }
        if (!wishlist.themivo) {
          setHiddenProductIds(null);
        } else if (wishlist.hiddenProductIds) {
          setHiddenProductIds(new Set(wishlist.hiddenProductIds));
        }
        setError(wishlist.error);
        setSetupRequired(Boolean(wishlist.setupRequired));
        setHasLoaded(true);
      })
      .catch((reason: unknown) => {
        if (!active) {
          return;
        }

        setError(
          reason instanceof Error
            ? reason.message
            : "errors.wishlistUnavailable",
        );
        setHasLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [initialWishlist]);

  useEffect(() => {
    if (!fetcher.data || lastResponse.current === fetcher.data) {
      return;
    }

    lastResponse.current = fetcher.data;
    const attemptedToggle = pendingProductId.current;
    if (!fetcher.data.error) {
      setAuthenticated(fetcher.data.authenticated);
      setProductIds(new Set(fetcher.data.productIds));
      setSavedProductCount(fetcher.data.savedProductCount);
      setSavedVariantIds(new Set(fetcher.data.savedVariantIds));
      if (attemptedToggle && toastPosition) {
        setToast({
          saved:
            fetcher.data.savedVariantIds?.includes(attemptedToggle) ||
            fetcher.data.productIds.includes(attemptedToggle),
        });
      }
    } else if (previousProductIds.current) {
      setProductIds(previousProductIds.current);
    }
    previousProductIds.current = null;
    setError(fetcher.data.error);
    setSetupRequired(Boolean(fetcher.data.setupRequired));
    setHasLoaded(true);
    setUpdatingProductId(null);
    pendingProductId.current = null;

    if (
      attemptedToggle &&
      (fetcher.data.loginRequired ||
        (!fetcher.data.acceptsGuests && !fetcher.data.authenticated))
    ) {
      const returnTo = `${location.pathname}${location.search}`;
      window.location.assign(
        `${loginPath}?return_to=${encodeURIComponent(returnTo)}`,
      );
    }
  }, [
    fetcher.data,
    location.pathname,
    location.search,
    loginPath,
    toastPosition,
  ]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const toggle = useCallback(
    (productId: string, variantId?: string) => {
      if (
        !hasLoaded ||
        pendingProductId.current ||
        fetcher.state !== "idle" ||
        (themivo && !hiddenProductIds) ||
        hiddenProductIds?.has(productId)
      ) {
        return;
      }

      if (!authenticated && (!acceptsGuests || (themivo && !guestEnabled))) {
        const returnTo = `${location.pathname}${location.search}`;
        window.location.assign(
          `${loginPath}?return_to=${encodeURIComponent(returnTo)}`,
        );
        return;
      }

      const variant = themivo ? variantId : undefined;
      const isSaved = variant
        ? savedVariantIds.has(variant)
        : productIds.has(productId);
      if (!themivo) {
        previousProductIds.current = productIds;
        const nextIds = new Set(productIds);
        if (isSaved) {
          nextIds.delete(productId);
        } else {
          nextIds.add(productId);
        }
        setProductIds(nextIds);
      }

      pendingProductId.current = variant ?? productId;
      setUpdatingProductId(variant ?? productId);
      setError(undefined);
      fetcher.submit(
        {
          productId,
          ...(variant && { variantId: variant }),
          intent: isSaved ? "remove" : "add",
        },
        { method: "POST", action: apiPath },
      );
    },
    [
      acceptsGuests,
      apiPath,
      authenticated,
      fetcher,
      guestEnabled,
      hasLoaded,
      hiddenProductIds,
      location.pathname,
      location.search,
      loginPath,
      productIds,
      savedVariantIds,
      themivo,
    ],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      authenticated,
      themivo,
      count: savedProductCount ?? productIds.size,
      isHidden: (productId) =>
        themivo && (!hiddenProductIds || hiddenProductIds.has(productId)),
      error,
      isLoading: !hasLoaded,
      isUpdating: (productId, variantId) =>
        updatingProductId === (variantId ?? productId),
      isWishlisted: (productId, variantId) =>
        variantId ? savedVariantIds.has(variantId) : productIds.has(productId),
      setupRequired,
      toggle,
    }),
    [
      authenticated,
      error,
      hasLoaded,
      hiddenProductIds,
      productIds,
      savedProductCount,
      savedVariantIds,
      setupRequired,
      themivo,
      toggle,
      updatingProductId,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      {toast && toastPosition && (
        <p
          role="status"
          className={cn(
            "pointer-events-none fixed inset-x-4 z-50 mx-auto w-fit rounded-lg border border-line-subtle bg-background px-4 py-3 text-body shadow-lg",
            toastPosition === "top" ? "top-4" : "bottom-4",
          )}
        >
          {t(toast.saved ? "wishlist.savedToast" : "wishlist.removedToast")}
        </p>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
