import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  base: "./",
  build: {
    outDir: "../energy-prototype",
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    sourcemap: false,
  },
});
