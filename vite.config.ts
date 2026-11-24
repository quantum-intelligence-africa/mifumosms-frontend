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
      // Call-center WebSocket (incoming-call rings, agent presence). The
      // backend only accepts origins on its CORS allow-list, so the proxied
      // upgrade request presents the one dev origin that is on it.
      "/voice-ws": {
        target: "https://voice-app.duckdns.org",
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/voice-ws/, "/ws"),
        configure: (proxy) => {
          proxy.on("proxyReqWs", (proxyReq) => proxyReq.setHeader("origin", "http://localhost:3000"));
        },
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
        // Let Rollup split by dependency graph: a library used only by lazy routes (charts, the IVR
        // flow builder, PDF/Excel export, the voice client) ships with those routes instead of in one
        // catch-all `vendor` chunk that every page had to download, parse and run. That catch-all used
        // to hold recharts (615 kB), chart.js (413 kB), motion-dom, lodash, canvg/pako/core-js (PDF
        // helpers), @xyflow (IVR builder) and the Africa's Talking client — about 1.5 MB on the login page.
        // React is not given its own chunk: react/react-dom are CommonJS, and splitting them out produced
        // a circular chunk-init order ("Cannot read properties of undefined (reading 'forwardRef')").
        // The automatic graph-based split has no such cycle.
        manualChunks(id) {
          // The default-language (English) dictionary is ~160 kB and was being
          // inlined into `main`, which every first visit must download serially
          // before anything paints. Ship it as its own chunk that still preloads
          // in parallel. NOTE: never pull the Swahili files in here — they are
          // dynamically imported (see LanguageContext) and must stay their own
          // lazy chunk, so a visitor downloads one language, not both.
          if (id.includes("/src/i18n/") && !id.includes("Sw") && !/[/\\]sw\.ts$/.test(id)) {
            return "i18n-en";
          }
          if (id.includes("node_modules")) {
            if (id.includes("xlsx")) return "xlsx";
            // Keep react/react-dom/scheduler in the entry chunk: splitting them
            // out produced a circular init order ("Cannot read properties of
            // undefined (reading 'forwardRef')"). Everything below only depends
            // on react, so shipping it as its own parallel-downloaded chunk is
            // safe and turns the one 941 kB serial download into several that
            // fetch concurrently (and cache independently across deploys).
            if (/[/\\](react|react-dom|scheduler)[/\\]/.test(id) || id.includes("react/jsx")) return;
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("date-fns")) return "date-fns";
          }
        },
      },
    },
  },
}));
