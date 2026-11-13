import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  envDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/team-member-migration.cloud.test.ts", "tests/native-organization.cloud.test.ts"],
    fileParallelism: false,
    restoreMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
