import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // Hydration state has no external events to unsubscribe from.
};

export function useClientReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
