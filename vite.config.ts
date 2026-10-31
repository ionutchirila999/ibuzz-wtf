// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { dependencyGuard } from "./build/dependency-guard-plugin";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // TEMPORARY publish test: known-incompatible override, revert after test.
    resolve: { alias: { entities: path.resolve(__dirname, "node_modules/entities") } },
    plugins: [
      dependencyGuard(__dirname),
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false, // public/manifest.webmanifest is authored by hand and linked in __root
        devOptions: { enabled: false },
        includeAssets: [
          "offline.html",
          "favicon.png",
          "icon-192.png",
          "icon-512.png",
          "icon-maskable-192.png",
          "icon-maskable-512.png",
          "apple-touch-icon.png",
        ],
        workbox: {
          runtimeCaching: [
            {
              // Offline fallback for installed visitors: try the network first,
              // then the last cached page, then the precached offline page.
              urlPattern: ({ request, url }: { request: Request; url: URL }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth") && !url.pathname.startsWith("/lovable/"),
              handler: "NetworkFirst",
              options: {
                networkTimeoutSeconds: 3,
                cacheName: "ibuzz-navigations",
                precacheFallback: { fallbackURL: "/offline.html" },
              },
            },
          ],
        },
      }),
    ],
  },
});
