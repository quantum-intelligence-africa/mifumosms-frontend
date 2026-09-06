import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Forward the SENDA Voice/IVR API through the dev server so browser
      // requests stay same-origin on localhost:8080 — the live backend's
      // CORS allowlist only permits localhost:3000, not 8080. See voiceApi.ts.
      "/voice-api": {
        target: "https://voice-app.duckdns.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/voice-api/, "/api"),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure SPA routing files are copied to build output
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Security: Remove console statements in production
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        // Split heavy/shared dependencies into their own chunks so the main
        // bundle stays small and vendors cache independently across deploys.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // `charts` used to be its own chunk (recharts/chart.js/d3-*), but
          // recharts pulls in a wide, tangled web of its own runtime deps
          // (victory-vendor -> real d3-shape/d3-scale, plus react-smooth,
          // lodash, clsx, tiny-invariant, react-is, eventemitter3...). Some
          // of those are leaf utilities used all over the app (clsx via
          // `lib/utils.ts`'s `cn()`, in particular), so catching all of them
          // into a `charts` bucket would drag that chunk onto every page's
          // initial load — worse than the bug it would fix. Only a couple
          // of them were actually being caught, splitting the library's
          // internals across the chunk boundary and producing a
          // `ReferenceError: Cannot access 'X' before initialization` from
          // a circular chunk-init order with `vendor` (same failure mode as
          // the React note below, just for charts). Simplest fix: let charts
          // fall through to `vendor` with everything else it needs, same as
          // React does.
          if (id.includes("xlsx")) return "xlsx";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
          if (id.includes("qrcode")) return "qrcode";
          if (id.includes("@radix-ui")) return "radix";
          // `motion` (framer-motion) is ~37 kB and only used on 5 routes. Splitting
          // it out keeps it off the every-page `vendor` chunk. It's a one-directional
          // consumer of React, so it's safe to split (unlike React core — see below).
          if (id.includes("/motion/") || id.includes("framer-motion")) return "motion";
          // NOTE: React core is intentionally NOT split into its own chunk.
          // react/react-dom are CommonJS, so Rollup's interop helpers get
          // hoisted into `vendor`; a separate react chunk then imports those
          // helpers from `vendor` while `vendor` imports React back — a
          // circular chunk-init order that leaves React undefined
          // ("Cannot read properties of undefined (reading 'forwardRef')").
          // Keeping React in `vendor` avoids the cycle. The splits above are
          // all one-directional leaf consumers, so they're safe.
          return "vendor";
        },
      },
    },
  },
}));
