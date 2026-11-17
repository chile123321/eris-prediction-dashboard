// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const localEnv = loadEnv("development", process.cwd(), "");
const configuredPort = Number.parseInt(localEnv["ERIS_DEV_PORT"] || "", 10);
const hasValidDevPort =
  Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65_535;

function getApiProxyTarget(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const target = new URL(value);
    return target.protocol === "http:" || target.protocol === "https:" ? target.origin : undefined;
  } catch {
    return undefined;
  }
}

const apiProxyTarget = getApiProxyTarget(localEnv["ERIS_API_PROXY_TARGET"]);
const isProductionBuild = process.env["NODE_ENV"] === "production";

if (!isProductionBuild && (!hasValidDevPort || !apiProxyTarget)) {
  throw new Error(
    "Missing or invalid ERIS_DEV_PORT / ERIS_API_PROXY_TARGET in the ignored local .env file.",
  );
}

export default defineConfig({
  vite: {
    server: {
      ...(hasValidDevPort ? { port: configuredPort } : {}),
      strictPort: true,
      ...(apiProxyTarget
        ? {
            proxy: {
              // Express mounts /api itself; retain the prefix and refresh-cookie path.
              "/api": { target: apiProxyTarget, changeOrigin: true },
            },
          }
        : {}),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
