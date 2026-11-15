import { defineConfig } from "vite";

// The plugin opens web/index.html from disk, where Chrome refuses module scripts:
// build one classic IIFE script and one stylesheet next to the page, no hashes, no chunks.
// public/index.html is the page itself and is copied as it is.
export default defineConfig({
  base: "./",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "../web",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/main.js",
      formats: ["iife"],
      name: "Flightdeck",
      fileName: () => "flightdeck.js",
      cssFileName: "flightdeck",
    },
    rolldownOptions: {
      output: { codeSplitting: false },
    },
  },
});
