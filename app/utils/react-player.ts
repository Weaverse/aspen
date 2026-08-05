import { type ComponentType, useSyncExternalStore } from "react";
import type { ReactPlayerProps } from "react-player";

type ReactPlayerComponent = ComponentType<ReactPlayerProps>;

function resolveReactPlayer(module: unknown) {
  const imported = (module as { default?: unknown }).default;
  const component =
    imported && typeof imported === "object" && "default" in imported
      ? imported.default
      : imported;

  return { default: component as ReactPlayerComponent };
}

export async function loadReactPlayer() {
  return resolveReactPlayer(await import("react-player"));
}

export async function loadLazyReactPlayer() {
  return resolveReactPlayer(await import("react-player/lazy"));
}

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
