import { randomBytes } from "node:crypto"
import { expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { admin } from "better-auth/plugins/admin"

const state = vi.hoisted(() => ({ write: vi.fn() }))
vi.mock("@/services/audit", () => ({
  recordAdminAudit: state.write,
  newAuditRequestId: () => "native-integration-audit",
}))
import { adminAudit } from "@/lib/auth/server/admin-audit"

it("records actual native admin HTTP responses with verified session context", async () => {
  state.write.mockReset().mockResolvedValue(undefined)
  const auth = betterAuth({
    baseURL: "https://sso.example",
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    logger: { disabled: true },
    rateLimit: { enabled: false },
    database: memoryAdapter({
      user: [],
      account: [],
      session: [],
      verification: [],
    }),
    emailAndPassword: { enabled: true },
    plugins: [admin(), adminAudit()],
  })
  const user = await auth.api.createUser({
    body: {
      name: "Admin",
      email: "admin@example.test",
      password: "Password-2026-test!",
      role: "admin",
    },
  })
  const login = await auth.api.signInEmail({
    body: { email: "admin@example.test", password: "Password-2026-test!" },
    asResponse: true,
  })
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
  expect(cookie).not.toBe("")
  expect(state.write).not.toHaveBeenCalled()
  const response = await auth.handler(
    new Request("https://sso.example/auth/admin/revoke-user-sessions", {
      method: "POST",
      headers: {
        cookie,
        origin: "https://sso.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ userId: user.user.id }),
    })
  )
  expect(response.status).toBe(200)
  expect(state.write.mock.calls[0][0].actor.id).toBe(user.user.id)
  expect(state.write.mock.calls[0][2]).toBe("requested")
  expect(state.write.mock.calls[1][2]).toBe("completed")
  expect(state.write.mock.calls[1][3]).toBe(200)
  expect(state.write.mock.calls[1][0].requestId).toBe(
    "native-integration-audit"
  )
})
