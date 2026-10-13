import { randomBytes } from "node:crypto"
import { readFile } from "node:fs/promises"
import { afterEach, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"

afterEach(() => vi.unstubAllEnvs())

it("uses the native single-secret environment configuration", async () => {
  const secret = randomBytes(48).toString("base64url")
  // Fully controlled fixture values; never load application env or a real DB.
  vi.stubEnv("BETTER_AUTH_SECRET", secret)
  vi.stubEnv("BETTER_AUTH_SECRETS", "")
  vi.stubEnv("AUTH_SECRET", "")
  const server = betterAuth({
    baseURL: "http://localhost:3300",
    basePath: "/auth",
    logger: { disabled: true },
  })
  const context = await server.$context
  expect(context.secret).toBe(secret)
  expect(context.secretConfig).toBe(secret)
})

it("keeps the maintained env contract free of the unused versioned secret export", async () => {
  for (const file of [
    ".env.example",
    "utils/environment.ts",
    "lib/auth/server/index.ts",
  ]) {
    const source = await readFile(
      new URL(`../${file}`, import.meta.url),
      "utf8"
    )
    expect(source).not.toContain("BETTER_AUTH_SECRETS")
    expect(source).not.toContain("betterAuthSecrets")
  }
})
