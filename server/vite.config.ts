import build from "@hono/vite-build/vercel"
import devServer from "@hono/vite-dev-server"
import { defineConfig } from "vite"

export default defineConfig({
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
  server: {
    host: true,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  plugins: [
    devServer({
      entry: "src/index.ts",
    }),
    build({
      entry: "src/index.ts",
      emptyOutDir: true,
      entryContentAfterHooks: [
        () =>
          "import { getRequestListener } from '@gorth/principle/cores/hono/server'",
      ],
      entryContentDefaultExportHook: (appName) =>
        `export default getRequestListener(${appName}.fetch)`,
    }),
  ],
})
