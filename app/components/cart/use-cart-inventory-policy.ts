import { useEffect, useState } from "react";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { CartWithOptimistic } from "./cart-types";
import { useCartStore } from "./store";

type Policy = "DENY" | "CONTINUE" | null;
const requests = new Map<string, Promise<Record<string, Policy>>>();

export function loadCartInventoryPolicies(path: string, ids: string[]) {
  const params = new URLSearchParams(ids.map((id) => ["id", id]));
  const key = `${path}?${params}`;
  let pending = requests.get(key);
  if (!pending) {
    pending = fetch(key)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Inventory policy unavailable");
        }
        const body = (await response.json()) as {
          policies: Record<string, Policy>;
        };
        if (!body.policies || typeof body.policies !== "object") {
          throw new Error("Inventory policy unavailable");
        }
        return Object.fromEntries(
          ids.map((id) => [id, body.policies[id] ?? null]),
        );
      })
      .catch(() => {
        requests.delete(key);
        return Object.fromEntries(ids.map((id) => [id, null]));
      });
    requests.set(key, pending);
  }
  return pending;
}

export function useCartInventoryPolicy(cart: CartWithOptimistic | null) {
  const path = usePrefixPathWithLocale("/api/cart-inventory-policy");
  const key = [
    ...new Set(cart?.lines.nodes.map((line) => line.merchandise.id) ?? []),
  ]
    .sort()
    .join(",");
  useEffect(() => {
    if (!key) {
      return;
    }
    const ids = key.split(",");
    for (let start = 0; start < ids.length; start += 20) {
      loadCartInventoryPolicies(path, ids.slice(start, start + 20)).then(
        (policies) => {
          useCartStore.setState((state) => ({
            inventoryPolicies: new Map([
              ...state.inventoryPolicies,
              ...Object.entries(policies),
            ]),
          }));
        },
      );
    }
  }, [path, key]);
}

/** Read policy only where Storefront availability cannot identify backorders. */
export function useVariantInventoryPolicy(
  id: string | undefined,
  enabled: boolean,
) {
  const path = usePrefixPathWithLocale("/api/cart-inventory-policy");
  const key = enabled && id ? `${path}:${id}` : "";
  const [state, setState] = useState<{ key: string; policy: Policy }>({
    key: "",
    policy: null,
  });
  useEffect(() => {
    if (!key || !id) {
      return;
    }
    let active = true;
    loadCartInventoryPolicies(path, [id]).then((policies) => {
      if (active) {
        setState({ key, policy: policies[id] ?? null });
      }
    });
    return () => {
      active = false;
    };
  }, [id, key, path]);
  return {
    policy: state.key === key ? state.policy : null,
    pending: Boolean(key && state.key !== key),
  };
}
