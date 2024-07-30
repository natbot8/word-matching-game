import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [],
  server: {
    host: "0.0.0.0",
    hmr: true,
  },
  resolve: {
    alias: {
      "@capacitor": resolve(__dirname, "node_modules/@capacitor"),
    },
  },
  build: {
    outDir: "www",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
});
