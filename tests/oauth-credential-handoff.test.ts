import { afterEach, expect, it, vi } from "vitest"
import {
  handoffOAuthCredential,
  readOAuthCredential,
  forgetOAuthCredential,
} from "@/utils/client/oauth-credential-handoff"
afterEach(() => vi.useRealTimers())
it("passes the one-time secret to its exact edit page and removes it after consumption", () => {
  vi.useFakeTimers()
  handoffOAuthCredential({
    id: "first",
    clientId: "chosen-client",
    secret: "test-only-secret",
  })
  expect(readOAuthCredential("another-client")).toBeNull()
  expect(readOAuthCredential("first")?.secret).toBe("test-only-secret")
  forgetOAuthCredential("first")
  expect(readOAuthCredential("first")).toBeNull()
})
it("expires an abandoned create-to-edit handoff", () => {
  vi.useFakeTimers()
  handoffOAuthCredential({
    id: "expired",
    clientId: "client",
    secret: "test-only-secret",
  })
  vi.advanceTimersByTime(60000)
  expect(readOAuthCredential("expired")).toBeNull()
})
