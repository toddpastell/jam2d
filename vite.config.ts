import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: { jam2d: "/src/index.ts" },
  },
  server: {
    open: "/examples/",
  },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    copyPublicDir: false,
  },
});
