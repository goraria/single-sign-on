import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  envDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    // Bundle UI exports so Next's extensionless subpaths resolve as they do in Next.js.
    server: { deps: { inline: ["@gorth/primitive"] } },
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 15_000,
  },
})
