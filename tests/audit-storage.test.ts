import { beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ values: vi.fn() }))
vi.mock("@/database", () => ({
  database: { insert: () => ({ values: state.values }) },
}))
vi.mock("@/utils/environment", () => ({ isProduction: true }))
import { recordAdminAudit } from "@/services/audit"

beforeEach(() => {
  state.values.mockReset().mockResolvedValue(undefined)
})
it("persists only allowlisted identity, target, timestamp defaults and result metadata", async () => {
  const operation = {
    actor: {
      id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
      name: "Admin",
      email: "admin@example.test",
      password: "never-log-password",
    },
    action: "session.delete",
    resourceType: "session",
    resourceId: "target",
    requestId: "request",
    body: { token: "never-log-token" },
    metadata: { secret: "never-log-secret" },
    cookie: "never-log-cookie",
  }
  await recordAdminAudit(operation, "failure", "completed", 403)
  expect(state.values).toHaveBeenCalledWith(
    expect.objectContaining({
      actorUserId: operation.actor.id,
      resourceId: "target",
      outcome: "failure",
      metadata: {
        actorName: "Admin",
        actorEmail: "admin@example.test",
        requestId: "request",
        phase: "completed",
        status: 403,
      },
    })
  )
  expect(JSON.stringify(state.values.mock.calls)).not.toContain("never-log")
})
it("returns a sanitized unavailable error without database parameters or secrets", async () => {
  state.values.mockRejectedValue(new Error("private connection-string"))
  await expect(
    recordAdminAudit(
      {
        actor: { id: "id" },
        action: "action",
        resourceType: "user",
        requestId: "request",
      },
      "success",
      "requested"
    )
  ).rejects.toThrow("audit_storage_unavailable")
})
