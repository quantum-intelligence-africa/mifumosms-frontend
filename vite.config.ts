import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
          if (
            id.includes("recharts") ||
            id.includes("chart.js") ||
            id.includes("react-chartjs-2") ||
            id.includes("/d3-")
          )
            return "charts";
          if (id.includes("xlsx")) return "xlsx";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
          if (id.includes("qrcode")) return "qrcode";
          if (id.includes("@radix-ui")) return "radix";
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
