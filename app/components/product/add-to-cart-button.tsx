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
import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { useMatches } from "react-router";
import { Button } from "~/components/button";
import { useCartFetcherSync } from "~/components/cart/cart-sync";
import { useCartStore } from "~/components/cart/store";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { getCartMutationError } from "~/utils/cart-error";
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
        {(fetcher: FetcherWithComponents<any>) => (
          <AddToCartContent
            analytics={analytics}
            className={className}
            disabled={Boolean(disabled)}
            fetcher={fetcher}
            hasValidLines={hasValidLines}
            isHydrated={isHydrated}
            lines={lines}
            onAdded={onAdded}
            props={props}
          >
            {children}
          </AddToCartContent>
        )}
      </CartForm>
    </div>
  );
}

function AddToCartContent({
  analytics,
  children,
  className,
  disabled,
  fetcher,
  hasValidLines,
  isHydrated,
  lines,
  onAdded,
  props,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  className: string;
  disabled: boolean;
  fetcher: FetcherWithComponents<any>;
  hasValidLines: boolean;
  isHydrated: boolean;
  lines: OptimisticCartLineInput[];
  onAdded?: () => void;
  props: Record<string, any>;
}) {
  const { t } = useTranslation();
  const pendingToken = useRef<string | null>(null);
  const isAdding = fetcher.state !== "idle";
  const errorMessage = getCartMutationError(fetcher.data, t);
  useCartFetcherSync(fetcher);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || !pendingToken.current) {
      return;
    }
    useCartStore.getState().clearPendingAdd(pendingToken.current);
    pendingToken.current = null;
  }, [fetcher.data, fetcher.state]);

  useEffect(
    () => () => {
      if (pendingToken.current) {
        useCartStore.getState().clearPendingAdd(pendingToken.current);
      }
    },
    [],
  );

  return (
    <AddToCartAnalytics fetcher={fetcher} onAdded={onAdded}>
      <input type="hidden" name="analytics" value={JSON.stringify(analytics)} />
      <div className="space-y-2">
        <Button
          type="submit"
          variant="primary"
          className={cn(className, "!border-none px-6 py-5")}
          disabled={Boolean(
            disabled || isAdding || !hasValidLines || !isHydrated,
          )}
          {...props}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            props.onClick?.(event);
            if (event.defaultPrevented) {
              return;
            }
            pendingToken.current = useCartStore
              .getState()
              .stagePendingAdd(lines);
            useCartStore.getState().open();
          }}
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
              {t("cart.adding")}
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

      // The drawer opens synchronously at click time. A completed request may
      // call the product-specific success callback, but must never reopen a
      // drawer the customer already dismissed.
      if (
        fetcherData.cart &&
        !fetcherData.userErrors?.length &&
        !fetcherData.errors?.length
      ) {
        onAdded?.();
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
