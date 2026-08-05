/**
 * SSR replacement for browser-only modules configured in vite.config.ts.
 *
 * Oxygen emits a single worker file and otherwise inlines dynamic imports.
 * This stub keeps react-player and its media stack out of the server bundle;
 * Aspen only mounts those players after hydration.
 */
export default function ClientOnlyStub(): null {
  return null;
}
