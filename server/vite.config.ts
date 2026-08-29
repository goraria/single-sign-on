import { defineConfig } from "vite"
import { corsOptions } from "@gorth/mechanism/configs/cors"
import { developmentServerPlugin } from "./configs/vite.ts"
import { clientUrl } from "./lib/utils/environment.ts"

const developmentOrigins = Array.from(
  new Set(
    ["http://localhost:3000", "http://127.0.0.1:3000", clientUrl]
      .flatMap((value) => value?.split(",") ?? [])
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter(Boolean)
  )
)

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  logLevel: "warn",

  server: {
    host: true,
    strictPort: true,
    cors: {
      ...corsOptions,
      origin: developmentOrigins,
    },
  },

  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },

  plugins: [developmentServerPlugin],

  build: {
    ssr: "app/main.ts",
    outDir: "dist",
    target: "node22",
    sourcemap: true,

    rollupOptions: {
      output: {
        entryFileNames: "index.js",
      },
    },
  },
})
