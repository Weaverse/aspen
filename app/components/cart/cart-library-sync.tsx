import { useEffect, useRef } from "react";
import { useFetchers } from "react-router";
import { CartAnalytics } from "~/components/root/analytics-views";
import { useCartActions } from "./cart-store";

/** Reconcile app-owned queued mutations with Hydrogen's cart and analytics store. */
export function CartLibrarySync() {
  const fetchers = useFetchers();
  const { refresh } = useCartActions();
  const seen = useRef(new WeakSet<object>());
  useEffect(() => {
    let changed = false;
    for (const f of fetchers) {
      if (
        f.state === "submitting" ||
        !f.data ||
        typeof f.data !== "object" ||
        seen.current.has(f.data)
      )
        continue;
      seen.current.add(f.data);
      if ("cart" in f.data) changed = true;
    }
    if (changed) refresh();
  }, [fetchers, refresh]);
  return <CartAnalytics />;
}
