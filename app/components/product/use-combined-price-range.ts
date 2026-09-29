import { useEffect, useState } from "react";
import type { ProductCardFragment } from "storefront-api.generated";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";

type PriceRange = ProductCardFragment["priceRange"];
type Pending = {
  id: string;
  resolve: (range: PriceRange | null) => void;
};

const pricePromises = new Map<string, Promise<PriceRange | null>>();
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

export function loadCombinedPriceRange(path: string, id: string) {
  const key = `${path}:${id}`;
  const cached = pricePromises.get(key);
  if (cached) {
    return cached;
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
  pricePromises.set(key, promise);
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
    loadCombinedPriceRange(path, id).then((value) => {
      if (active) {
        setState({ key, range: value });
      }
    });
    return () => {
      active = false;
    };
  }, [path, id, enabled, key]);

  const ready = enabled && state.key === key;
  return {
    range: ready ? state.range : null,
    isLoading: enabled && !ready,
  };
}
