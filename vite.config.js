import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      input: {
        main: fromRoot("./index.html"),
        privacy: fromRoot("./privacy.html"),
        "404": fromRoot("./404.html"),
      },
      output: {},
    },
  },
});
