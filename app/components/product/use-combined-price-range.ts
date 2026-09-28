import { useEffect, useState } from "react";
import type { ProductCardFragment } from "storefront-api.generated";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";

type PriceRange = ProductCardFragment["priceRange"];
type Pending = {
  id: string;
  resolve: (range: PriceRange | null) => void;
};

type CacheEntry = {
  expiresAt: number;
  promise: Promise<PriceRange | null>;
};

export const COMBINED_PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

const pricePromises = new Map<string, CacheEntry>();
const pendingByPath = new Map<string, Pending[]>();

async function flush(path: string) {
  const pending = pendingByPath.get(path) ?? [];
  pendingByPath.delete(path);
  for (let start = 0; start < pending.length; start += 20) {
    const batch = pending.slice(start, start + 20);
    const params = new URLSearchParams();
    for (const { id } of batch) {
      params.append("id", id);
    }
    try {
      const response = await fetch(`${path}?${params}`);
      if (!response.ok) {
        throw new Error("Combined prices unavailable");
      }
      const { ranges } = (await response.json()) as {
        ranges: Record<string, PriceRange>;
      };
      for (const { id, resolve } of batch) {
        resolve(ranges[id] ?? null);
      }
    } catch {
      for (const { id, resolve } of batch) {
        pricePromises.delete(`${path}:${id}`);
        resolve(null);
      }
    }
  }
}

export function clearCombinedPriceRangeCache() {
  pricePromises.clear();
  pendingByPath.clear();
}

export function loadCombinedPriceRange(path: string, id: string) {
  const key = `${path}:${id}`;
  const cached = pricePromises.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }
  if (cached) {
    pricePromises.delete(key);
  }

  const promise = new Promise<PriceRange | null>((resolve) => {
    const pending = pendingByPath.get(path) ?? [];
    pending.push({ id, resolve });
    if (pending.length === 1) {
      setTimeout(() => {
        flush(path);
      }, 0);
    }
    pendingByPath.set(path, pending);
  });
  pricePromises.set(key, {
    expiresAt: Date.now() + COMBINED_PRICE_CACHE_TTL_MS,
    promise,
  });
  return promise;
}

type CombinedPriceState = {
  key: string;
  range: PriceRange | null;
};

export function useCombinedPriceRange(id: string, enabled: boolean) {
  const path = usePrefixPathWithLocale("/api/combined-prices");
  const key = enabled ? `${path}:${id}` : "";
  const [state, setState] = useState<CombinedPriceState>({
    key: "",
    range: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      const request = loadCombinedPriceRange(path, id);
      const expiresAt =
        pricePromises.get(key)?.expiresAt ??
        Date.now() + COMBINED_PRICE_CACHE_TTL_MS;
      request.then((value) => {
        if (!active) {
          return;
        }
        setState({ key, range: value });
        refreshTimer = setTimeout(refresh, Math.max(0, expiresAt - Date.now()));
      });
    };

    refresh();
    return () => {
      active = false;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [path, id, enabled, key]);

  const ready = enabled && state.key === key;
  return {
    range: ready ? state.range : null,
    isLoading: enabled && !ready,
  };
}
