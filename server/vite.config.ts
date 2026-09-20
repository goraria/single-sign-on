import build from "@hono/vite-build/vercel"
import devServer from "@hono/vite-dev-server"
import { defineConfig } from "vite"

export default defineConfig({
  clearScreen: false,
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
      entry: "app/main.ts",
    }),
    build({
      entry: "app/main.ts",
      entryContentAfterHooks: [
        () => "import { handle } from 'hono/vercel'",
      ],
      entryContentDefaultExportHook: (appName) =>
        `export default handle(${appName})`,
    }),
  ],
})
