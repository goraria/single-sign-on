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
        () => "import { handle } from 'hono/vercel'",
      ],
      entryContentDefaultExportHook: (appName) =>
        `export default handle(${appName})`,
    }),
  ],
})
