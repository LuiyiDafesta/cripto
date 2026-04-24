import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  base: mode === "production" ? "/aurafinance/" : "/",
  build: {
    outDir: "../",
    emptyOutDir: false,
    assetsDir: "_source",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/cmc": {
        target: "https://pro-api.coinmarketcap.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/cmc/, ""),
        headers: {
          "X-CMC_PRO_API_KEY": env.VITE_CMC_API_KEY || "",
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  };
});
