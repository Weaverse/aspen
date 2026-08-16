import type {
  OptimisticCartLineInput,
  ShopifyAddToCartPayload,
  ShopifyPageViewPayload,
} from "@shopify/hydrogen";
import {
  AnalyticsEventName,
  CartForm,
  getClientBrowserParameters,
  sendShopifyAnalytics,
} from "@shopify/hydrogen";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { useMatches } from "react-router";
import { Button } from "~/components/button";
import { syncCartState } from "~/components/cart/cart-state-provider";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";

export function AddToCartButton({
  children,
  lines,
  className = "",
  containerClassName,
  width = "full",
  disabled,
  analytics,
  onAdded,
  ...props
}: {
  children: React.ReactNode;
  lines: OptimisticCartLineInput[];
  className?: string;
  containerClassName?: string;
  width?: "auto" | "full";
  disabled?: boolean;
  analytics?: unknown;
  onAdded?: () => void;
  [key: string]: any;
}) {
  const cartRoute = usePrefixPathWithLocale("/cart");
  const [isHydrated, setIsHydrated] = useState(false);
  const hasValidLines =
    lines.length > 0 &&
    lines.every(
      (line) =>
        typeof line.merchandiseId === "string" &&
        line.merchandiseId.length > 0 &&
        Number.isInteger(line.quantity) &&
        Number(line.quantity) > 0,
    );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div
      className={cn(width === "full" ? "w-full" : "w-auto", containerClassName)}
    >
      <CartForm
        route={cartRoute}
        inputs={{ lines }}
        action={CartForm.ACTIONS.LinesAdd}
      >
        {(fetcher: FetcherWithComponents<any>) => {
          const isAdding = fetcher.state !== "idle";
          const errorMessage =
            fetcher.data?.userErrors?.[0]?.message ||
            fetcher.data?.errors?.[0]?.message;
          return (
            <AddToCartAnalytics fetcher={fetcher} onAdded={onAdded}>
              <input
                type="hidden"
                name="analytics"
                value={JSON.stringify(analytics)}
              />
              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className={cn(className, "!border-none px-6 py-5")}
                  disabled={Boolean(
                    disabled || isAdding || !hasValidLines || !isHydrated,
                  )}
                  {...props}
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Adding...
                    </span>
                  ) : (
                    children
                  )}
                </Button>
                {errorMessage && (
                  <p role="alert" className="text-red-700 text-sm">
                    {errorMessage}
                  </p>
                )}
              </div>
            </AddToCartAnalytics>
          );
        }}
      </CartForm>
    </div>
  );
}

function usePageAnalytics({ hasUserConsent }: { hasUserConsent: boolean }) {
  const matches = useMatches();

  return useMemo(() => {
    const data: Record<string, unknown> = {};
    for (const match of matches) {
      const eventData = match?.data as Record<string, unknown>;
      if (eventData) {
        if (eventData.analytics) {
          Object.assign(data, eventData.analytics);
        }
        const selectedLocale =
          (eventData.selectedLocale as typeof DEFAULT_LOCALE) || DEFAULT_LOCALE;
        Object.assign(data, {
          currency: selectedLocale.currency,
          acceptedLanguage: selectedLocale.language,
        });
      }
    }

    return {
      ...data,
      hasUserConsent,
    } as unknown as ShopifyPageViewPayload;
  }, [matches, hasUserConsent]);
}

function AddToCartAnalytics({
  fetcher,
  children,
  onAdded,
}: {
  fetcher: FetcherWithComponents<any>;
  children: React.ReactNode;
  onAdded?: () => void;
}) {
  const fetcherData = fetcher.data;
  const formData = fetcher.formData;
  const pageAnalytics = usePageAnalytics({ hasUserConsent: true });
  const handledData = useRef<unknown>(null);

  useEffect(() => {
    if (fetcherData && handledData.current !== fetcherData) {
      handledData.current = fetcherData;
      const cartData: Record<string, unknown> = {};

      if (formData) {
        const cartInputs = CartForm.getFormInput(formData);
        try {
          if (cartInputs.inputs.analytics) {
            const dataInForm: unknown = JSON.parse(
              String(cartInputs.inputs.analytics),
            );
            Object.assign(cartData, dataInForm);
          }
        } catch {
          // Analytics must never block the cart success state.
        }
      }

      // Open cart drawer after successful add to cart (regardless of analytics)
      if (
        fetcherData.cart &&
        !fetcherData.userErrors?.length &&
        !fetcherData.errors?.length
      ) {
        window.setTimeout(() => {
          syncCartState(fetcherData.cart);
          onAdded?.();
          toggleCartDrawer(true);
        }, 0);
      }

      // Send analytics if we have cart data
      if (Object.keys(cartData).length && fetcherData.cart) {
        const addToCartPayload: ShopifyAddToCartPayload = {
          ...getClientBrowserParameters(),
          ...pageAnalytics,
          ...cartData,
          cartId: fetcherData.cart.id,
        };

        sendShopifyAnalytics({
          eventName: AnalyticsEventName.ADD_TO_CART,
          payload: addToCartPayload,
        });
      }
    }
  }, [fetcherData, formData, onAdded, pageAnalytics]);

  return <>{children}</>;
}
