import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import {
  AuthError,
  createIdentityCache,
  createOAuthIdentityValidator,
} from "@gorth/structure/modules/auth/server"

const read = (path: string) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8")
const manifest = JSON.parse(read("package.json"))

it("limits the fullstack workspace to the app root, not the archived pkg", () => {
  expect(read("pnpm-workspace.yaml")).toContain("packages:\n  - .\n")
})

it("keeps Better Auth app-owned and uses public Structure infrastructure exports", () => {
  expect(manifest.dependencies["better-auth"]).toBeTruthy()
  expect(manifest.dependencies["@gorth/structure"]).toBeTruthy()
  for (const dependency of [
    "axios",
    "zod",
    "jose",
    "pg",
    "postgres",
    "uuid",
    "ably",
    "@supabase/supabase-js",
    "@supabase/ssr",
    "vaul",
  ]) {
    expect(manifest.dependencies[dependency], dependency).toBeUndefined()
  }
  expect(createIdentityCache).toBeTypeOf("function")
  expect(createOAuthIdentityValidator).toBeTypeOf("function")
  expect(new AuthError("rejected").code).toBe("rejected")
})

it("uses Structure PG directly while keeping SSO plugins owned by SSO", () => {
  expect(read("database/index.ts")).toContain(
    'from "@gorth/structure/cores/pg"'
  )
  expect(read("database/index.ts")).not.toContain("@/lib/structure")
  for (const dependency of [
    "@better-auth/oauth-provider",
    "@better-auth/infra",
    "@better-auth/sso",
  ])
    expect(manifest.dependencies[dependency]).toBeTruthy()
  expect(read("lib/auth/server/index.ts")).not.toContain("cores/auth")
})
