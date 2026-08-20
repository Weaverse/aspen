import { reactRouter } from "@react-router/dev/vite";
import { hydrogen } from "@shopify/hydrogen/vite";
import { oxygen } from "@shopify/mini-oxygen/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

// The Oxygen worker inlines dynamic imports, so replace browser-only media
// packages during SSR to avoid shipping their player stacks in the worker.
const SSR_STUBBED_MODULES = new Set(["react-player"]);

function ssrStubClientOnlyModules(): Plugin {
  return {
    name: "ssr-stub-client-only-modules",
    enforce: "pre",
    resolveId(id, _importer, options) {
      if (options?.ssr && SSR_STUBBED_MODULES.has(id)) {
        return fileURLToPath(
          new URL("./app/utils/ssr-client-only-stub.ts", import.meta.url),
        );
      }
      return null;
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    hydrogen(),
    oxygen(),
    reactRouter(),
    tailwindcss(),
    ssrStubClientOnlyModules(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
    ...(!isSsrBuild && {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Keep lazy react-player chunks separate from eager media code.
            if (id.includes("swiper")) return "vendor-media";
            if (id.includes("react-share")) return "vendor-social";
            if (id.includes("@radix-ui")) return "vendor-radix";
          },
        },
      },
    }),
  },
  server: {
    fs: {
      allow: [".", "/Users/brucechau/.codex/attachments"],
    },
    warmup: {
      clientFiles: [
        "./app/routes/**/*",
        "./app/sections/**/*",
        "./app/components/**/*",
      ],
    },
    allowedHosts: true,
  },
  ssr: {
    optimizeDeps: {
      include: [
        "@radix-ui/react-primitive",
        "jsonp",
        "classnames",
        "react-share",
      ],
    },
  },
}));
