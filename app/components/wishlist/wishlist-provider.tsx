import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFetcher, useLocation, useNavigate } from "react-router";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { WishlistApiResponse } from "~/types/wishlist";

type WishlistContextValue = {
  authenticated: boolean;
  error?: string;
  isLoading: boolean;
  isUpdating: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;
  setupRequired: boolean;
  toggle: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  initialWishlist,
}: {
  children: React.ReactNode;
  initialWishlist: Promise<WishlistApiResponse> | WishlistApiResponse;
}) {
  const apiPath = usePrefixPathWithLocale("/api/wishlist");
  const loginPath = usePrefixPathWithLocale("/account/login");
  const fetcher = useFetcher<WishlistApiResponse>({ key: "account-wishlist" });
  const location = useLocation();
  const navigate = useNavigate();
  const pendingProductId = useRef<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [productIds, setProductIds] = useState<Set<string>>(() => new Set());
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

        setAuthenticated(wishlist.authenticated);
        setProductIds(new Set(wishlist.productIds));
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
            : "Wishlist is temporarily unavailable.",
        );
        setHasLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [initialWishlist]);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }

    const attemptedToggle = pendingProductId.current;
    setAuthenticated(fetcher.data.authenticated);
    setProductIds(new Set(fetcher.data.productIds));
    setError(fetcher.data.error);
    setSetupRequired(Boolean(fetcher.data.setupRequired));
    setHasLoaded(true);
    setUpdatingProductId(null);
    pendingProductId.current = null;

    if (!fetcher.data.authenticated && attemptedToggle) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`${loginPath}?return_to=${encodeURIComponent(returnTo)}`);
    }
  }, [fetcher.data, location.pathname, location.search, loginPath, navigate]);

  const toggle = useCallback(
    (productId: string) => {
      if (!hasLoaded || fetcher.state !== "idle") {
        return;
      }

      if (!authenticated) {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(`${loginPath}?return_to=${encodeURIComponent(returnTo)}`);
        return;
      }

      const isSaved = productIds.has(productId);
      const nextIds = new Set(productIds);
      if (isSaved) {
        nextIds.delete(productId);
      } else {
        nextIds.add(productId);
      }

      pendingProductId.current = productId;
      setUpdatingProductId(productId);
      setProductIds(nextIds);
      setError(undefined);
      fetcher.submit(
        { productId, intent: isSaved ? "remove" : "add" },
        { method: "POST", action: apiPath },
      );
    },
    [
      apiPath,
      authenticated,
      fetcher,
      hasLoaded,
      location.pathname,
      location.search,
      loginPath,
      navigate,
      productIds,
    ],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      authenticated,
      error,
      isLoading: !hasLoaded,
      isUpdating: (productId) => updatingProductId === productId,
      isWishlisted: (productId) => productIds.has(productId),
      setupRequired,
      toggle,
    }),
    [
      authenticated,
      error,
      hasLoaded,
      productIds,
      setupRequired,
      toggle,
      updatingProductId,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
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
