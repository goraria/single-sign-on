import { expect, it } from "vitest"
import { allowLocalAppRedirect } from "@/utils/oauth-local-redirect"

it("permits only the seven approved loopback web callback/logout origins", () => {
  for (let port = 3030; port <= 3036; port++) {
    expect(allowLocalAppRedirect(new URL(`http://localhost:${port}/auth/callback/gorth`))).toBe(true)
    expect(allowLocalAppRedirect(new URL(`http://localhost:${port}/`))).toBe(true)
  }
})
it.each([
  "http://localhost:3037/auth/callback/gorth",
  "http://localhost:3030/evil", "http://localhost:3030/auth/callback/gorth?next=evil",
  "http://localhost:3030/auth/callback/gorth#secret", "http://user@localhost:3030/",
  "http://127.0.0.1:3030/", "http://192.168.1.1:3030/",
  "http://localhost.evil.test:3030/", "http://localhost.:3030/",
  "https://localhost:3030/", "http://app.example:3030/",
])("does not exempt an unapproved redirect: %s", (uri) => {
  expect(allowLocalAppRedirect(new URL(uri))).toBe(false)
})
