import { beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ write: vi.fn(), session: vi.fn() }))
vi.mock("@/services/audit", () => ({
  recordAdminAudit: state.write,
  newAuditRequestId: () => "native-audit",
}))
vi.mock("better-auth/api", async () => ({
  ...(await vi.importActual("better-auth/api")),
  createAuthMiddleware: (fn: unknown) => fn,
  getAuthoritativeSessionFromCtx: state.session,
}))
import { adminAudit } from "@/lib/auth/server/admin-audit"
import { APIError } from "better-auth/api"
beforeEach(() => {
  state.write.mockReset().mockResolvedValue(undefined)
  state.session
    .mockReset()
    .mockResolvedValue({
      user: {
        id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
        name: "Admin",
        email: "admin@example.com",
      },
    })
})
it("audits native HTTP mutations but not reads or nested server API calls", async () => {
  const plugin = adminAudit()
  const before = plugin.hooks!.before![0]
  const after = plugin.hooks!.after![0]
  const ctx = {
    path: "/admin/revoke-user-session",
    request: new Request("https://sso.example/auth/admin/revoke-user-session", {
      method: "POST",
    }),
    body: { sessionToken: "never-log-token" },
    context: { returned: { success: true } },
  } as unknown as Parameters<typeof before.handler>[0] &
    Parameters<typeof before.matcher>[0]
  expect(before.matcher(ctx)).toBe(true)
  expect(before.matcher({ ...ctx, request: undefined })).toBe(false)
  expect(
    before.matcher({
      ...ctx,
      request: new Request("https://sso.example/auth/admin/list-users"),
    })
  ).toBe(false)
  await before.handler(ctx)
  await after.handler(ctx)
  expect(state.write.mock.calls[1]).toEqual([
    expect.objectContaining({
      action: "auth-admin.post.revoke-user-session",
      requestId: "native-audit",
    }),
    "success",
    "completed",
    200,
  ])
  expect(JSON.stringify(state.write.mock.calls)).not.toContain(
    "never-log-token"
  )
})
it("records native API errors with their failure status", async () => {
  const plugin = adminAudit()
  const before = plugin.hooks!.before![0]
  const after = plugin.hooks!.after![0]
  const ctx = {
    path: "/admin/set-role",
    request: new Request("https://sso.example/auth/admin/set-role", {
      method: "POST",
    }),
    context: { returned: new APIError("FORBIDDEN", { message: "denied" }) },
  } as unknown as Parameters<typeof before.handler>[0]
  await before.handler(ctx)
  await after.handler(ctx)
  expect(state.write.mock.calls[1][1]).toBe("failure")
  expect(state.write.mock.calls[1][3]).toBe(403)
})
it("fails closed when native audit intent cannot be recorded", async () => {
  state.write.mockRejectedValue(new Error("unavailable"))
  const before = adminAudit().hooks!.before![0]
  const ctx = {
    path: "/admin/set-role",
    request: new Request("https://sso.example/auth/admin/set-role", {
      method: "POST",
    }),
    context: {},
  } as unknown as Parameters<typeof before.handler>[0]
  await expect(before.handler(ctx)).rejects.toThrow("audit_storage_unavailable")
})
